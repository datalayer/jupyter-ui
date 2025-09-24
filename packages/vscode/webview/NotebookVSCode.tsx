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
  CellSidebarExtension,
} from '@datalayer/jupyter-react';
import { DatalayerCollaborationProvider } from '@datalayer/core/lib/collaboration';
import { MessageHandlerContext, type ExtensionMessage } from './messageHandler';
import { loadFromBytes, saveToBytes } from './utils';
import { createMockServiceManager } from './mockServiceManager';
import { createServiceManager } from './serviceManager';
import { ServiceManager } from '@jupyterlab/services';
// Import the enhanced theme system
import { EnhancedJupyterReactTheme } from './theme';
// Import the custom VS Code-style toolbar
import { NotebookToolbar } from './NotebookToolbar';

interface RuntimeInfo {
  uid: string;
  name: string;
  status?: string;
  url?: string;
  token?: string;
  environment?: string;
  creditsUsed?: number;
  creditsLimit?: number;
}

interface NotebookVSCodeInnerProps {
  nbformat: any;
  isDatalayerNotebook: boolean;
  documentId?: string;
  serverUrl?: string;
  token?: string;
  isInitialized: boolean;
  selectedRuntime?: RuntimeInfo;
  onRuntimeSelected?: (runtime: RuntimeInfo) => void;
}

function NotebookVSCodeInner({
  nbformat,
  isDatalayerNotebook,
  documentId,
  serverUrl,
  token,
  isInitialized,
  selectedRuntime,
  onRuntimeSelected,
}: NotebookVSCodeInnerProps): JSX.Element {
  const messageHandler = useContext(MessageHandlerContext);
  const currentNotebookModel = useRef<any>(null);
  const lastSavedContent = useRef<Uint8Array | null>(null);
  const contentChangeHandler = useRef<(() => void) | null>(null);

  // Create notebook extensions (sidebar)
  const extensions = useMemo(() => [new CellSidebarExtension({})], []);

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

  // Keep track of current service manager and update it when runtime changes
  const [serviceManager, setServiceManager] = useState<
    ServiceManager.IManager | undefined
  >(() => {
    // Initial service manager
    if (isDatalayerNotebook) {
      console.log(
        '[NotebookVSCode] Initial mock service manager for Datalayer notebook',
      );
      return createMockServiceManager();
    }
    return undefined;
  });

  // Update service manager when runtime changes
  useEffect(() => {
    if (selectedRuntime?.url && selectedRuntime?.token) {
      console.log(
        '[NotebookVSCode] Runtime selected, creating real service manager:',
        selectedRuntime.name,
        selectedRuntime.url,
      );
      const newServiceManager = createServiceManager(
        selectedRuntime.url,
        selectedRuntime.token,
      );
      setServiceManager(newServiceManager);

      // Store runtime in sessionStorage for persistence
      if (documentId) {
        const key = `datalayer_runtime_${documentId}`;
        sessionStorage.setItem(key, JSON.stringify(selectedRuntime));
        console.log('[NotebookVSCode] Stored runtime info in sessionStorage');
      }
    } else if (isDatalayerNotebook && !serviceManager) {
      // Only create mock if we don't have any service manager
      console.log('[NotebookVSCode] No runtime, using mock service manager');
      setServiceManager(createMockServiceManager());
    }
  }, [selectedRuntime, isDatalayerNotebook, documentId]);

  // Restore runtime info on mount
  useEffect(() => {
    if (documentId && !selectedRuntime && isDatalayerNotebook) {
      const key = `datalayer_runtime_${documentId}`;
      const stored = sessionStorage.getItem(key);
      if (stored) {
        try {
          const runtime = JSON.parse(stored);
          console.log(
            '[NotebookVSCode] Restoring runtime from sessionStorage:',
            runtime,
          );
          setSelectedRuntime(runtime);
        } catch (e) {
          console.error('[NotebookVSCode] Failed to parse stored runtime:', e);
          sessionStorage.removeItem(key);
        }
      }
    }
  }, [documentId, isDatalayerNotebook]);

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

  const height = 'calc(100vh - 31px)'; // Subtract toolbar height
  const cellSidebarMargin = 120;

  // For Datalayer notebooks, render directly with the mock service manager
  if (isDatalayerNotebook && serviceManager) {
    return (
      <div
        style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
      >
        <NotebookToolbar
          notebookId={documentId!}
          isDatalayerNotebook={true}
          selectedRuntime={selectedRuntime}
        />
        <Box
          style={{
            height,
            width: '100%',
            position: 'relative',
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
              },
              '& .datalayer-NotebookPanel-header': {
                display: 'none',
              },
              '& .jp-Cell': {
                // Remove width constraint to allow sidebar
                width: '100%',
              },
              '& .jp-Notebook-footer': {
                // Remove width constraint to allow sidebar
                width: '100%',
              },
              '& .jp-Notebook-cellSidebar': {
                display: 'flex',
                minWidth: '40px',
              },
              '& .jp-Cell-Sidebar': {
                display: 'flex',
              },
              '.dla-Box-Notebook': {
                position: 'relative',
              },
              '.dla-Jupyter-Notebook .dla-Notebook-Container': {
                width: '100%',
              },
              '& .jp-CodeMirrorEditor': {
                cursor: 'text !important',
              },
            }}
          >
            <Notebook2
              nbformat={nbformat}
              id={documentId!}
              serviceManager={serviceManager}
              collaborationProvider={collaborationProvider}
              height={height}
              cellSidebarMargin={120}
              extensions={extensions}
              onNotebookModelChanged={
                !isDatalayerNotebook ? handleNotebookModelChanged : undefined
              }
            />
          </Box>
        </Box>
      </div>
    );
  }

  // For local notebooks, don't wrap in Jupyter provider - we'll manage the service manager ourselves
  return (
    <LocalNotebook
      nbformat={nbformat}
      height={height}
      cellSidebarMargin={cellSidebarMargin}
      onNotebookModelChanged={handleNotebookModelChanged}
      selectedRuntime={selectedRuntime}
    />
  );
}

// Separate component for local notebooks
function LocalNotebook({
  nbformat,
  height,
  cellSidebarMargin,
  onNotebookModelChanged,
  selectedRuntime,
}: any) {
  // Create service manager from selected runtime if available
  const serviceManager = useMemo(() => {
    if (selectedRuntime?.url && selectedRuntime?.token !== undefined) {
      console.log(
        '[LocalNotebook] Creating service manager from runtime:',
        selectedRuntime,
      );
      return createServiceManager(selectedRuntime.url, selectedRuntime.token);
    }
    // Use mock service manager by default (no auto-start kernel)
    console.log(
      '[LocalNotebook] Using mock service manager (no kernel selected)',
    );
    return createMockServiceManager();
  }, [selectedRuntime]);

  // Create notebook extensions (sidebar)
  const extensions = useMemo(() => [new CellSidebarExtension({})], []);

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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NotebookToolbar
        notebookId="local-notebook"
        isDatalayerNotebook={false}
        selectedRuntime={selectedRuntime}
      />
      <Box
        style={{
          height,
          width: '100%',
          position: 'relative',
          flex: 1,
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
            },
            '& .datalayer-NotebookPanel-header': {
              display: 'none',
            },
            '& .jp-Cell': {
              // Remove width constraint to allow sidebar
              width: '100%',
            },
            '& .jp-Notebook-footer': {
              // Remove width constraint to allow sidebar
              width: '100%',
            },
            '& .jp-Notebook-cellSidebar': {
              display: 'flex',
              minWidth: '40px',
            },
            '& .jp-Cell-Sidebar': {
              display: 'flex',
            },
            '.dla-Box-Notebook': {
              position: 'relative',
            },
            '.dla-Jupyter-Notebook .dla-Notebook-Container': {
              width: '100%',
            },
            '& .jp-CodeMirrorEditor': {
              cursor: 'text !important',
            },
          }}
        >
          <Notebook2
            nbformat={nbformat}
            id="local-notebook"
            serviceManager={serviceManager}
            startDefaultKernel
            height={height}
            cellSidebarMargin={120}
            extensions={extensions}
            onNotebookModelChanged={onNotebookModelChanged}
          />
        </Box>
      </Box>
    </div>
  );
}

// Inner component that handles the notebook logic
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
  const [selectedRuntime, setSelectedRuntime] = useState<
    RuntimeInfo | undefined
  >();

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
      } else if (type === 'runtime-selected' && body.runtime) {
        console.log('[NotebookVSCode] Runtime selected:', body.runtime);
        setSelectedRuntime(body.runtime);
        // Force a re-render by also updating a dummy state if needed
        console.log(
          '[NotebookVSCode] Updated selectedRuntime state to:',
          body.runtime,
        );
      } else if (type === 'set-runtime' && body.baseUrl) {
        // Handle runtime selection for local notebooks
        console.log(
          '[NotebookVSCode] Setting runtime for local notebook:',
          body.baseUrl,
        );
        // Create a runtime info object from the URL
        const runtimeInfo: RuntimeInfo = {
          uid: 'local-runtime',
          name: 'Jupyter Server',
          url: body.baseUrl,
          token: body.token || '',
          status: 'ready',
        };
        setSelectedRuntime(runtimeInfo);
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

  // Use the enhanced theme system for VS Code theme support
  return (
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
        selectedRuntime={selectedRuntime}
        onRuntimeSelected={setSelectedRuntime}
      />
    </EnhancedJupyterReactTheme>
  );
}

// Main component
function NotebookVSCode(): JSX.Element {
  return <NotebookVSCodeWithJupyter />;
}

// Add debug function to window at module load time
declare global {
  interface Window {
    debugNotebook: () => any[];
  }
}

window.debugNotebook = function () {
  const all = document.querySelectorAll('*');
  const results: any[] = [];

  all.forEach((el: Element) => {
    const style = getComputedStyle(el);
    const bg = style.backgroundColor;

    // Check for black or near-black backgrounds
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        const [_, r, g, b] = match;
        if (parseInt(r) < 50 && parseInt(g) < 50 && parseInt(b) < 50) {
          results.push({
            element: el,
            tag: el.tagName,
            id: el.id,
            classes: el.className,
            backgroundColor: bg,
            parent: el.parentElement?.tagName,
            parentId: el.parentElement?.id,
            parentClasses: el.parentElement?.className,
          });
        }
      }
    }
  });

  console.log('Dark elements found:', results);
  results.forEach(r => {
    console.log(
      `${r.tag}#${r.id || 'no-id'}.${r.classes || 'no-class'} = ${r.backgroundColor}`,
    );
  });
  return results;
};

// Log that the debug function is available
console.log(
  '[NotebookVSCode] Debug function installed on window.debugNotebook',
);

document.addEventListener('DOMContentLoaded', () => {
  const root = createRoot(
    document.getElementById('notebook-editor') ?? document.body,
  );
  root.render(<NotebookVSCode />);
});
