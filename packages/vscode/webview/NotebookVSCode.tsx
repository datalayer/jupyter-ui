/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import { createRoot } from 'react-dom/client';
import { Box } from '@primer/react';
import {
  Notebook2,
  JupyterReactTheme,
  type ICollaborationProvider,
  useJupyterReactStore,
  Jupyter,
  useJupyter,
} from '@datalayer/jupyter-react';
import { DatalayerCollaborationProvider } from '@datalayer/core/lib/collaboration';
import { MessageHandlerContext, type ExtensionMessage } from './messageHandler';
import { loadFromBytes, saveToBytes } from './utils';
import { createMockServiceManager } from './mockServiceManager';
// Import the enhanced theme system
import { EnhancedJupyterReactTheme } from './theme';

interface NotebookVSCodeInnerProps {
  nbformat: any;
  isDatalayerNotebook: boolean;
  documentId?: string;
  serverUrl?: string;
  token?: string;
  isInitialized: boolean;
}

function NotebookVSCodeInner({
  nbformat,
  isDatalayerNotebook,
  documentId,
  serverUrl,
  token,
  isInitialized,
}: NotebookVSCodeInnerProps): JSX.Element {
  const messageHandler = useContext(MessageHandlerContext);
  const currentNotebookModel = useRef<any>(null);
  const lastSavedContent = useRef<Uint8Array | null>(null);
  const contentChangeHandler = useRef<(() => void) | null>(null);

  // Create collaboration provider for Datalayer notebooks
  const collaborationProvider = useMemo(() => {
    if (isDatalayerNotebook && serverUrl && token && documentId) {
      console.log(
        '[NotebookVSCode] Creating Datalayer collaboration provider for document:',
        documentId,
      );
      // Create Datalayer-specific collaboration provider
      // Cast to ICollaborationProvider to handle @jupyter/ydoc version mismatch
      return new DatalayerCollaborationProvider({
        runUrl: serverUrl,
        token: token,
      }) as unknown as ICollaborationProvider;
    }
    return undefined;
  }, [isDatalayerNotebook, serverUrl, token, documentId]);

  // Create the appropriate service manager
  const serviceManager = useMemo(() => {
    if (isDatalayerNotebook) {
      console.log(
        '[NotebookVSCode] Using mock service manager for Datalayer notebook',
      );
      return createMockServiceManager();
    }
    // For local notebooks, we'll get the service manager from the Jupyter context
    return undefined;
  }, [isDatalayerNotebook]);

  // Handle notebook model changes for local notebooks only
  const handleNotebookModelChanged = useCallback(
    (notebookModel: any) => {
      console.log('[NotebookVSCode] handleNotebookModelChanged called', {
        isDatalayerNotebook,
        hasModel: !!notebookModel,
        modelType: notebookModel?.constructor?.name,
        isDirty: notebookModel?.dirty,
        hasStateChanged: !!notebookModel?.stateChanged,
        hasContentChanged: !!notebookModel?.contentChanged,
        modelKeys: notebookModel ? Object.keys(notebookModel) : [],
      });

      // Only track changes for local notebooks
      if (!isDatalayerNotebook && notebookModel) {
        console.log(
          '[NotebookVSCode] Setting up notebook model for local notebook',
        );
        currentNotebookModel.current = notebookModel;

        // Disconnect any previous listeners
        if (contentChangeHandler.current) {
          try {
            // Try to disconnect from stateChanged signal
            if (currentNotebookModel.current?.stateChanged) {
              currentNotebookModel.current.stateChanged.disconnect(
                contentChangeHandler.current,
              );
              console.log(
                '[NotebookVSCode] Disconnected previous stateChanged listener',
              );
            }
          } catch (e) {
            // Ignore if not connected
          }
        }

        // Try both contentChanged and stateChanged signals
        let connectedSignal = false;

        // First try contentChanged signal (more direct for content changes)
        if (notebookModel.contentChanged) {
          console.log('[NotebookVSCode] Connecting to contentChanged signal');

          const handleContentChange = () => {
            console.log('[NotebookVSCode] Content changed signal fired!');
            try {
              // Get the notebook content as JSON
              const notebookData = notebookModel.toJSON();
              const bytes = saveToBytes(notebookData);

              console.log(
                '[NotebookVSCode] Sending content change to extension, size:',
                bytes.length,
              );

              // Notify the extension about the change
              messageHandler.postMessage({
                type: 'notebook-content-changed',
                body: { content: bytes },
              });
              lastSavedContent.current = bytes;
            } catch (error) {
              console.error(
                '[NotebookVSCode] Error processing content change:',
                error,
              );
            }
          };

          // Store and connect the handler
          contentChangeHandler.current = handleContentChange;
          notebookModel.contentChanged.connect(handleContentChange);
          connectedSignal = true;
          console.log(
            '[NotebookVSCode] Successfully connected to contentChanged signal',
          );
        }

        // Also try stateChanged as a fallback
        if (notebookModel.stateChanged && !connectedSignal) {
          console.log(
            '[NotebookVSCode] Connecting to stateChanged signal as fallback',
          );

          const handleStateChange = (sender: any, args: any) => {
            console.log('[NotebookVSCode] State changed signal received', {
              isDirty: notebookModel.dirty,
              changeType: args?.name,
              oldValue: args?.oldValue,
              newValue: args?.newValue,
            });

            // For any state change, check if content might have changed
            try {
              const notebookData = notebookModel.toJSON();
              const bytes = saveToBytes(notebookData);

              // Only send if content actually changed
              if (
                !lastSavedContent.current ||
                bytes.length !== lastSavedContent.current.length ||
                !bytes.every((v, i) => v === lastSavedContent.current![i])
              ) {
                console.log(
                  '[NotebookVSCode] Content has changed, notifying extension',
                );
                messageHandler.postMessage({
                  type: 'notebook-content-changed',
                  body: { content: bytes },
                });
                lastSavedContent.current = bytes;
              }
            } catch (error) {
              console.error(
                '[NotebookVSCode] Error processing state change:',
                error,
              );
            }
          };

          contentChangeHandler.current = handleStateChange;
          notebookModel.stateChanged.connect(handleStateChange);
          connectedSignal = true;
          console.log(
            '[NotebookVSCode] Connected to stateChanged signal as fallback',
          );

          // Store initial content and check initial dirty state
          try {
            const initialData = notebookModel.toJSON();
            const initialBytes = saveToBytes(initialData);
            lastSavedContent.current = initialBytes;
            console.log('[NotebookVSCode] Initial state:', {
              contentSize: initialBytes.length,
              isDirty: notebookModel.dirty,
            });

            // If notebook is already dirty on load, notify extension
            if (notebookModel.dirty) {
              console.log(
                '[NotebookVSCode] Notebook is dirty on load, notifying extension',
              );
              messageHandler.postMessage({
                type: 'notebook-content-changed',
                body: { content: initialBytes },
              });
            }
          } catch (error) {
            console.error(
              '[NotebookVSCode] Error storing initial content:',
              error,
            );
          }
        } else {
          console.warn(
            '[NotebookVSCode] Notebook model does not have stateChanged signal',
          );
        }
      } else if (isDatalayerNotebook) {
        console.log(
          '[NotebookVSCode] Skipping change tracking for Datalayer notebook',
        );
      }
    },
    [isDatalayerNotebook, messageHandler],
  );

  // Handle messages from the extension for save operations
  useEffect(() => {
    if (!isDatalayerNotebook) {
      const handleMessage = (message: ExtensionMessage) => {
        if (message.type === 'getFileData') {
          console.log(
            '[NotebookVSCode] Extension requested file data for save, requestId:',
            message.requestId,
          );
          // Get the current notebook content
          let bytes: Uint8Array;

          if (currentNotebookModel.current) {
            try {
              const notebookData = currentNotebookModel.current.toJSON();
              bytes = saveToBytes(notebookData);
              console.log(
                '[NotebookVSCode] Got current notebook data, size:',
                bytes.length,
              );
            } catch (error) {
              console.error(
                '[NotebookVSCode] Error getting notebook data:',
                error,
              );
              // Fallback to original nbformat
              bytes = saveToBytes(nbformat);
            }
          } else {
            // Fallback to original nbformat if model not available yet
            console.log(
              '[NotebookVSCode] No model available, using original nbformat',
            );
            bytes = saveToBytes(nbformat);
          }

          // Convert Uint8Array to regular array for message passing
          const arrayData = Array.from(bytes);

          // Send response with the requestId
          messageHandler.postMessage({
            type: 'response',
            requestId: message.requestId,
            body: arrayData,
          });
          console.log(
            '[NotebookVSCode] Sent notebook data to extension, array length:',
            arrayData.length,
          );

          // Mark the notebook as clean after save
          if (
            currentNotebookModel.current &&
            currentNotebookModel.current.dirty
          ) {
            console.log(
              '[NotebookVSCode] Marking notebook as clean after save',
            );
            currentNotebookModel.current.dirty = false;
          }
        } else if (message.type === 'saved') {
          // Handle saved notification from extension
          console.log('[NotebookVSCode] Notebook saved successfully');
          if (
            currentNotebookModel.current &&
            currentNotebookModel.current.dirty
          ) {
            console.log(
              '[NotebookVSCode] Marking notebook as clean after successful save',
            );
            currentNotebookModel.current.dirty = false;
          }
        }
      };

      const disposable = messageHandler.registerCallback(handleMessage);
      return () => disposable.dispose();
    }
  }, [isDatalayerNotebook, messageHandler, nbformat]);

  // Set up ResizeObserver for the notebook
  React.useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;
    let retryCount = 0;
    const maxRetries = 10;

    const setupNotebookResize = () => {
      const notebookElement = document.querySelector('.jp-Notebook');
      const notebookPanel = document.querySelector('.jp-NotebookPanel');

      if (notebookElement || notebookPanel) {
        resizeObserver = new ResizeObserver(() => {
          // Force a window resize event which JupyterLab components listen to
          window.dispatchEvent(new Event('resize'));

          // Also dispatch to the specific elements
          if (notebookElement) {
            notebookElement.dispatchEvent(new Event('resize'));
          }
          if (notebookPanel) {
            notebookPanel.dispatchEvent(new Event('resize'));
          }
        });

        if (notebookPanel && notebookPanel.parentElement) {
          resizeObserver.observe(notebookPanel.parentElement);
        } else if (notebookElement && notebookElement.parentElement) {
          resizeObserver.observe(notebookElement.parentElement);
        }
      } else if (retryCount < maxRetries) {
        // Retry if elements not found yet
        retryCount++;
        setTimeout(setupNotebookResize, 200);
      }
    };

    // Start setup after a delay
    const timeoutId = setTimeout(setupNotebookResize, 100);

    return () => {
      clearTimeout(timeoutId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // Following the Notebook2Collaborative pattern
  // For Datalayer notebooks: use collaboration only (no path prop)
  // For local notebooks: use service manager with kernel support
  console.log(
    '[NotebookVSCodeInner] Render check - isInitialized:',
    isInitialized,
    'nbformat:',
    nbformat,
    'isDatalayerNotebook:',
    isDatalayerNotebook,
  );
  if (!isInitialized || !nbformat) {
    return (
      <Box
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div>Loading notebook...</div>
      </Box>
    );
  }

  const height = '100vh';
  const cellSidebarMargin = 120;

  // For Datalayer notebooks, render directly with the mock service manager
  if (isDatalayerNotebook && serviceManager) {
    return (
      <Box
        style={{
          height,
          width: '100%',
          position: 'relative',
          backgroundColor: 'transparent',
        }}
        id="dla-Jupyter-Notebook"
      >
        <Box
          className="dla-Box-Notebook"
          sx={{
            height,
            width: '100%',
            overflowY: 'hidden',
            fontSize: 'var(--vscode-editor-font-size, 13px)',
            fontFamily:
              'var(--vscode-editor-font-family, "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace)',
            '& .datalayer-NotebookPanel-header': {
              minHeight: '50px',
            },
            '& .jp-Notebook': {
              flex: '1 1 auto !important',
              height: '100%',
              fontSize: 'var(--vscode-editor-font-size, 13px)',
            },
            '& .jp-NotebookPanel': {
              height: '100% !important',
              width: '100% !important',
            },
            '& .jp-Cell': {
              fontSize: 'var(--vscode-editor-font-size, 13px)',
            },
            '& .jp-InputArea-editor': {
              fontSize: 'var(--vscode-editor-font-size, 13px)',
            },
            '& .jp-OutputArea': {
              fontSize: 'var(--vscode-editor-font-size, 13px)',
            },
            '& .CodeMirror': {
              fontSize: 'var(--vscode-editor-font-size, 13px) !important',
            },
            '& .cm-editor': {
              fontSize: 'var(--vscode-editor-font-size, 13px) !important',
            },
            '& .jp-Toolbar': {
              display: 'none',
              zIndex: 0,
            },
            '& .jp-Toolbar .jp-HTMLSelect.jp-DefaultStyle select': {
              fontSize: '14px',
            },
            '& .jp-Toolbar > .jp-Toolbar-responsive-opener': {
              display: 'none',
            },
            '& .jp-Toolbar-kernelName': {
              display: 'none',
            },
            '& .jp-Cell': {
              width: `calc(100% - ${cellSidebarMargin}px)`,
            },
            '& .jp-Notebook-footer': {
              width: `calc(100% - ${cellSidebarMargin + 82}px)`,
            },
            '& .jp-CodeMirrorEditor': {
              cursor: 'text !important',
            },
            '.dla-Box-Notebook': {
              position: 'relative',
            },
            '.dla-Jupyter-Notebook .dla-Notebook-Container': {
              width: '100%',
            },
          }}
        >
          <Notebook2
            nbformat={nbformat}
            id={documentId!}
            serviceManager={serviceManager}
            collaborationProvider={collaborationProvider}
            height={height}
            onNotebookModelChanged={
              !isDatalayerNotebook ? handleNotebookModelChanged : undefined
            }
          />
        </Box>
      </Box>
    );
  }

  // For local notebooks, wrap in Jupyter provider to get the real service manager
  return (
    <Jupyter>
      <LocalNotebook
        nbformat={nbformat}
        height={height}
        cellSidebarMargin={cellSidebarMargin}
        onNotebookModelChanged={handleNotebookModelChanged}
      />
    </Jupyter>
  );
}

// Separate component for local notebooks that uses the Jupyter context
function LocalNotebook({
  nbformat,
  height,
  cellSidebarMargin,
  onNotebookModelChanged,
}: any) {
  const { serviceManager } = useJupyter();

  // Set up ResizeObserver specifically for this notebook
  React.useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;
    let retryCount = 0;
    const maxRetries = 10;

    const setupNotebookResize = () => {
      const notebookElement = document.querySelector('.jp-Notebook');
      const notebookPanel = document.querySelector('.jp-NotebookPanel');

      if (notebookElement || notebookPanel) {
        resizeObserver = new ResizeObserver(() => {
          // Force a window resize event which JupyterLab components listen to
          window.dispatchEvent(new Event('resize'));

          // Also dispatch to the specific elements
          if (notebookElement) {
            notebookElement.dispatchEvent(new Event('resize'));
          }
          if (notebookPanel) {
            notebookPanel.dispatchEvent(new Event('resize'));
          }
        });

        if (notebookPanel && notebookPanel.parentElement) {
          resizeObserver.observe(notebookPanel.parentElement);
        } else if (notebookElement && notebookElement.parentElement) {
          resizeObserver.observe(notebookElement.parentElement);
        }
      } else if (retryCount < maxRetries) {
        // Retry if elements not found yet
        retryCount++;
        setTimeout(setupNotebookResize, 200);
      }
    };

    // Start setup after a delay
    const timeoutId = setTimeout(setupNotebookResize, 100);

    return () => {
      clearTimeout(timeoutId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  if (!serviceManager) {
    return (
      <Box style={{ padding: '20px' }}>Waiting for service manager...</Box>
    );
  }

  return (
    <Box
      style={{
        height,
        width: '100%',
        position: 'relative',
        backgroundColor: 'transparent',
      }}
      id="dla-Jupyter-Notebook"
    >
      <Box
        className="dla-Box-Notebook"
        sx={{
          height,
          width: '100%',
          overflowY: 'hidden',
          fontSize: 'var(--vscode-editor-font-size, 13px)',
          fontFamily:
            'var(--vscode-editor-font-family, "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace)',
          '& .datalayer-NotebookPanel-header': {
            minHeight: '50px',
          },
          '& .jp-Notebook': {
            flex: '1 1 auto !important',
            height: '100%',
            fontSize: 'var(--vscode-editor-font-size, 13px)',
          },
          '& .jp-NotebookPanel': {
            height: '100% !important',
            width: '100% !important',
          },
          '& .jp-Cell': {
            fontSize: 'var(--vscode-editor-font-size, 13px)',
          },
          '& .jp-InputArea-editor': {
            fontSize: 'var(--vscode-editor-font-size, 13px)',
          },
          '& .jp-OutputArea': {
            fontSize: 'var(--vscode-editor-font-size, 13px)',
          },
          '& .CodeMirror': {
            fontSize: 'var(--vscode-editor-font-size, 13px) !important',
          },
          '& .cm-editor': {
            fontSize: 'var(--vscode-editor-font-size, 13px) !important',
          },
          '& .jp-Toolbar': {
            display: 'none',
            zIndex: 0,
          },
          '& .jp-Toolbar .jp-HTMLSelect.jp-DefaultStyle select': {
            fontSize: '14px',
          },
          '& .jp-Toolbar > .jp-Toolbar-responsive-opener': {
            display: 'none',
          },
          '& .jp-Toolbar-kernelName': {
            display: 'none',
          },
          '& .jp-Cell': {
            width: `calc(100% - ${cellSidebarMargin}px)`,
          },
          '& .jp-Notebook-footer': {
            width: `calc(100% - ${cellSidebarMargin + 82}px)`,
          },
          '& .jp-CodeMirrorEditor': {
            cursor: 'text !important',
          },
          '.dla-Box-Notebook': {
            position: 'relative',
          },
          '.dla-Jupyter-Notebook .dla-Notebook-Container': {
            width: '100%',
          },
        }}
      >
        <Notebook2
          nbformat={nbformat}
          id="local-notebook"
          serviceManager={serviceManager}
          startDefaultKernel
          height={height}
          onNotebookModelChanged={onNotebookModelChanged}
        />
      </Box>
    </Box>
  );
}

// Inner component that uses the Jupyter context
function NotebookVSCodeWithJupyter(): JSX.Element {
  const messageHandler = useContext(MessageHandlerContext);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isInitialized, setIsInitialized] = useState(false);
  const { setColormode } = useJupyterReactStore();

  // Lift notebook-related state up to parent to prevent state loss
  const [nbformat, setNbformat] = useState(undefined);
  const [isDatalayerNotebook, setIsDatalayerNotebook] = useState(false);
  const [documentId, setDocumentId] = useState<string | undefined>();
  const [serverUrl, setServerUrl] = useState<string | undefined>();
  const [token, setToken] = useState<string | undefined>();

  // Signal ready immediately when component mounts
  useEffect(() => {
    messageHandler.postMessage({ type: 'ready' });
  }, [messageHandler]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Just dispatch resize event which JupyterLab components listen to
      window.dispatchEvent(new Event('resize'));
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle all messages in the parent
  useEffect(() => {
    const handleMessage = (message: ExtensionMessage) => {
      const { type, body } = message;
      console.log('[NotebookVSCode] Parent received message:', type, body);

      if (type === 'init') {
        // Handle theme
        if (body.theme) {
          console.log('[NotebookVSCode] Setting initial theme:', body.theme);
          setTheme(body.theme);
          // The colormode will be synced via the useEffect
        }

        // Handle notebook data
        console.log('[NotebookVSCode] Processing init message');

        if (body.isDatalayerNotebook) {
          setIsDatalayerNotebook(true);
        }

        if (body.documentId) {
          setDocumentId(body.documentId);
          console.log('[NotebookVSCode] Got document ID:', body.documentId);
        }

        if (body.serverUrl) {
          setServerUrl(body.serverUrl);
          console.log('[NotebookVSCode] Got server URL:', body.serverUrl);
        }

        if (body.token) {
          setToken(body.token);
          console.log('[NotebookVSCode] Got authentication token');
        }

        if (body.untitled) {
          console.log(
            '[NotebookVSCode] Setting empty nbformat for untitled notebook',
          );
          setNbformat({} as any);
        } else {
          const loadedNbformat = loadFromBytes(body.value);
          console.log('[NotebookVSCode] Loaded nbformat:', loadedNbformat);
          setNbformat(loadedNbformat);
        }

        setIsInitialized(true);
        console.log('[NotebookVSCode] Initialization complete');
      } else if (type === 'theme-change' && body.theme) {
        console.log(
          '[NotebookVSCode] Theme change detected. Current:',
          theme,
          'New:',
          body.theme,
        );
        if (body.theme !== theme) {
          console.log('[NotebookVSCode] Applying theme change to:', body.theme);
          setTheme(body.theme);
          // The colormode will be synced via the useEffect
        }
      }
    };

    const disposable = messageHandler.registerCallback(handleMessage);

    return () => {
      disposable.dispose();
    };
  }, [messageHandler, setColormode, theme]);

  // Sync colormode with theme changes
  useEffect(() => {
    console.log('[NotebookVSCode] Syncing colormode with theme:', theme);
    setColormode(theme);
  }, [theme, setColormode]);

  // Get VS Code background color for consistent background
  const vscodeBackground = React.useMemo(() => {
    const bg =
      getComputedStyle(document.documentElement).getPropertyValue(
        '--vscode-editor-background',
      ) ||
      document.documentElement.style.getPropertyValue(
        '--vscode-editor-background',
      ) ||
      (theme === 'dark' ? '#1e1e1e' : '#ffffff');
    return bg;
  }, [theme]);

  // Apply background to body element as well
  React.useEffect(() => {
    document.body.style.backgroundColor = vscodeBackground;
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, [vscodeBackground]);

  // Use the enhanced theme system for VS Code theme support
  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        backgroundColor: vscodeBackground,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <EnhancedJupyterReactTheme
        provider="vscode"
        colorMode={theme === 'dark' ? 'dark' : 'light'}
        loadJupyterLabCss={true}
        injectCSSVariables={true}
      >
        <NotebookVSCodeInner
          nbformat={nbformat}
          isDatalayerNotebook={isDatalayerNotebook}
          documentId={documentId}
          serverUrl={serverUrl}
          token={token}
          isInitialized={isInitialized}
        />
      </EnhancedJupyterReactTheme>
    </div>
  );
}

// Main component that provides the Jupyter context
function NotebookVSCode(): JSX.Element {
  return (
    <Jupyter>
      <NotebookVSCodeWithJupyter />
    </Jupyter>
  );
}

document.addEventListener('DOMContentLoaded', () => {
  const root = createRoot(
    document.getElementById('notebook-editor') ?? document.body,
  );
  root.render(<NotebookVSCode />);
});
