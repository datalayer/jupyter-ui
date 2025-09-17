/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';
import { createRoot } from 'react-dom/client';
import { ServiceManager } from '@jupyterlab/services';
import { Box, Button } from '@primer/react';
import {
  useKernelId,
  useNotebookModel,
  Notebook2Base,
  JupyterReactTheme,
  Loader,
} from '@datalayer/jupyter-react';
import { MessageHandlerContext, type ExtensionMessage } from './messageHandler';
import { createServiceManager } from './serviceManager';
import { loadFromBytes } from './utils';

// Error boundary component to catch React errors
class NotebookErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('[NotebookVSCode] Error boundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[NotebookVSCode] Error boundary details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          style={{
            padding: '20px',
            textAlign: 'center',
            color: 'var(--vscode-errorForeground)',
            backgroundColor: 'var(--vscode-editor-background)',
          }}
        >
          <h3>Notebook Loading Error</h3>
          <p>
            The notebook failed to load properly. Please try reopening the file.
          </p>
          <details style={{ marginTop: '10px', textAlign: 'left' }}>
            <summary>Error Details</summary>
            <pre style={{ fontSize: '12px', marginTop: '10px' }}>
              {this.state.error?.message || 'Unknown error'}
            </pre>
          </details>
        </Box>
      );
    }

    return this.props.children;
  }
}

function NotebookVSCode(): JSX.Element {
  const height = '100vh';
  const maxHeight = '100vh';
  const cellSidebarMargin = '120px';
  const messageHandler = useContext(MessageHandlerContext);
  const [isLoading, setIsLoading] = useState(true);
  const [nbformat, setNbformat] = useState(undefined);
  const [serviceManager, setServiceManager] = useState<
    ServiceManager | undefined
  >();
  const [isNotebookReady, setIsNotebookReady] = useState(false);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const notebookInstanceRef = useRef<string | null>(null);

  // Create model but only use it when ready
  const rawModel = useNotebookModel({ nbformat });

  // Only create kernel when notebook is ready
  const kernelId = useKernelId({
    kernels: isNotebookReady ? serviceManager?.kernels : undefined,
    startDefaultKernel: isNotebookReady,
  });

  // Only use model when notebook is ready to prevent premature rendering
  const _model = isNotebookReady ? rawModel : null;

  // Add debugging and improved lifecycle management
  useEffect(() => {
    console.log('[NotebookVSCode] Model state changed:', {
      rawModel: !!rawModel,
      nbformat: !!nbformat,
      isLoading,
      containerRef: !!containerRef,
      isNotebookReady,
    });

    if (rawModel && !notebookInstanceRef.current) {
      console.log(
        '[NotebookVSCode] Model loaded successfully, stopping loading',
      );
      setIsLoading(false);

      // Defer notebook rendering to ensure DOM is ready
      if (containerRef && !isNotebookReady) {
        console.log(
          '[NotebookVSCode] Container ready, deferring notebook render',
        );

        // Mark that we're initializing to prevent multiple attempts
        notebookInstanceRef.current = 'initializing';

        // Wait for next tick to ensure DOM is stable
        setTimeout(() => {
          // Check if container is still valid and in DOM
          if (
            containerRef &&
            containerRef.isConnected &&
            document.body.contains(containerRef)
          ) {
            console.log('[NotebookVSCode] Container verified in DOM');

            // Use requestIdleCallback to wait for browser idle time
            const idleCallback = requestIdleCallback(
              () => {
                // Final check before rendering
                if (containerRef && containerRef.isConnected) {
                  console.log(
                    '[NotebookVSCode] Browser idle, setting notebook as ready',
                  );
                  setIsNotebookReady(true);
                  notebookInstanceRef.current = 'ready';
                }
              },
              { timeout: 500 },
            );

            // Cleanup on unmount
            return () => {
              cancelIdleCallback(idleCallback);
              notebookInstanceRef.current = null;
            };
          } else {
            console.warn(
              '[NotebookVSCode] Container not properly connected to DOM',
            );
            notebookInstanceRef.current = null;
          }
        }, 100);
      }
    }
  }, [rawModel, nbformat, isLoading, containerRef, isNotebookReady]);

  // Add service manager debugging
  useEffect(() => {
    console.log('[NotebookVSCode] Service manager state:', {
      serviceManager: !!serviceManager,
      kernels: !!serviceManager?.kernels,
    });
  }, [serviceManager]);
  const handler = useCallback(
    async (message: ExtensionMessage) => {
      const { type, body, id } = message;
      console.log('[NotebookVSCode] Received message:', {
        type,
        bodyExists: !!body,
        id,
      });

      try {
        switch (type) {
          case 'init': {
            console.log('[NotebookVSCode] Initializing notebook:', {
              untitled: body.untitled,
              hasValue: !!body.value,
              valueSize: body.value?.byteLength || 0,
            });

            // FIXME
            // editor.setEditable(body.editable);
            if (body.untitled) {
              console.log(
                '[NotebookVSCode] Setting empty notebook format for untitled',
              );
              setNbformat({} as any);
              return;
            } else {
              console.log('[NotebookVSCode] Loading notebook from bytes');
              const modelContent = await loadFromBytes(body.value);
              console.log('[NotebookVSCode] Loaded model content:', {
                hasContent: !!modelContent,
                cellCount: modelContent?.cells?.length || 0,
              });
              setNbformat(modelContent);
              return;
            }
          }
          case 'update': {
            console.log('[NotebookVSCode] Update message received');
            // const strokes = body.edits.map(
            //   edit => new Stroke(edit.color, edit.stroke)
            // );
            // await editor.reset(body.content, strokes);
            return;
          }
          case 'getFileData': {
            console.log('[NotebookVSCode] Get file data message received');
            // Get the image data for the canvas and post it back to the extension.
            // editor.getImageData().then(data => {
            //   messageHandler.postMessage({
            //     type: 'response',
            //     requestId,
            //     body: Array.from(data),
            //   });
            // });
            return;
          }
          case 'set-runtime': {
            console.log('[NotebookVSCode] Setting runtime:', {
              baseUrl: body.baseUrl,
              hasToken: !!body.token,
            });
            const { baseUrl, token } = body;
            setServiceManager(createServiceManager(baseUrl, token));
            return;
          }
        }
      } catch (error) {
        console.error('[NotebookVSCode] Error handling message:', type, error);
      }
    },
    [messageHandler, setNbformat, setServiceManager],
  );
  useEffect(() => {
    const disposable = messageHandler.registerCallback(handler);
    // Signal to VS Code that the webview is initialized.
    messageHandler.postMessage({ type: 'ready' });
    return () => {
      disposable.dispose();
    };
  }, [messageHandler, handler]);
  const selectRuntime = useCallback(async () => {
    const reply = await messageHandler.postRequest({ type: 'select-runtime' });
    const { baseUrl, token } = reply.body ?? {};
    setServiceManager(createServiceManager(baseUrl, token));
  }, [messageHandler]);
  return isLoading ? (
    <Loader key="notebook-loader" />
  ) : (
    <Box
      style={{ height, width: '100%', position: 'relative' }}
      id="dla-Jupyter-Notebook"
    >
      <Box sx={{ display: 'flex' }}>
        <Button
          title="Select a runtime for the current notebook."
          onClick={selectRuntime}
        >
          Select Runtime
        </Button>
      </Box>
      <Box
        className="dla-Box-Notebook"
        sx={{
          height,
          maxHeight,
          width: '100%',
          overflowY: 'hidden',
          '& .datalayer-NotebookPanel-header': {
            minHeight: '50px',
          },
          '& .jp-Notebook': {
            flex: '1 1 auto !important',
            height: '100%',
          },
          '& .jp-NotebookPanel': {
            height: '100% !important',
            width: '100% !important',
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
        }}
      >
        <div
          ref={ref => {
            if (ref && !containerRef) {
              console.log('[NotebookVSCode] Container ref set');
              setContainerRef(ref);
            }
          }}
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
          }}
        >
          {rawModel && isNotebookReady && containerRef && (
            <NotebookErrorBoundary>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                }}
              >
                <React.Suspense fallback={<div>Loading notebook...</div>}>
                  <Notebook2Base
                    key="notebook-instance"
                    kernelId={kernelId}
                    model={rawModel}
                    serviceManager={serviceManager}
                  />
                </React.Suspense>
              </div>
            </NotebookErrorBoundary>
          )}
          {rawModel && !isNotebookReady && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                color: 'var(--vscode-foreground)',
              }}
            >
              <div>Initializing notebook...</div>
            </div>
          )}
        </div>
      </Box>
    </Box>
  );
}

// Main function that gets executed once the webview DOM loads
export function main() {
  console.log('[NotebookVSCode] Main function starting');

  try {
    const notebookElement = document.getElementById('notebook-editor');
    if (!notebookElement) {
      console.error(
        '[NotebookVSCode] notebook-editor element not found in DOM',
      );
      return;
    }

    console.log('[NotebookVSCode] Creating React root');
    const root = createRoot(notebookElement);

    console.log('[NotebookVSCode] Rendering notebook component');
    root.render(
      <JupyterReactTheme colormode="dark">
        <NotebookErrorBoundary>
          <NotebookVSCode />
        </NotebookErrorBoundary>
      </JupyterReactTheme>,
    );

    console.log('[NotebookVSCode] Notebook component rendered successfully');

    // Add a global error handler to catch unhandled errors
    window.addEventListener('error', event => {
      console.error('[NotebookVSCode] Global error:', event.error, event);
      if (event.error?.message?.includes('insertWidget')) {
        console.error(
          '[NotebookVSCode] insertWidget error detected - this may be related to widget timing issues',
        );
      }
    });

    window.addEventListener('unhandledrejection', event => {
      console.error(
        '[NotebookVSCode] Unhandled promise rejection:',
        event.reason,
      );
    });
  } catch (error) {
    console.error('[NotebookVSCode] Error in main function:', error);
  }
}
