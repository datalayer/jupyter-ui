/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module NotebookVSCode
 * @description React component for the Jupyter notebook editor.
 * Provides the main UI for viewing and editing Jupyter notebooks with full kernel support.
 */

import React, { useCallback, useContext, useEffect, useState } from 'react';
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
  const [runtimeReady, setRuntimeReady] = useState(false);
  const kernelId = useKernelId({
    kernels: serviceManager?.kernels,
    startDefaultKernel: runtimeReady,
  });
  const model = useNotebookModel({ nbformat });
  useEffect(() => {
    if (model && serviceManager) {
      setIsLoading(false);
    }
  }, [model, serviceManager]);
  const handler = useCallback(
    async (message: ExtensionMessage) => {
      const { type, body, id } = message;
      switch (type) {
        case 'init': {
          // FIXME
          // editor.setEditable(body.editable);

          // Initialize runtime if provided
          if (body.runtime) {
            const { baseUrl, token } = body.runtime;
            if (baseUrl && token) {
              console.log(
                '[NotebookVSCode] Initializing with runtime:',
                baseUrl,
              );
              const manager = createServiceManager(baseUrl, token);
              setServiceManager(manager);
              setRuntimeReady(true);
            } else {
              console.warn(
                '[NotebookVSCode] Runtime info incomplete:',
                body.runtime,
              );
            }
          } else {
            console.log(
              '[NotebookVSCode] No runtime info provided in init message',
            );
          }

          if (body.untitled) {
            setNbformat({} as any);
            return;
          } else {
            setNbformat(loadFromBytes(body.value));
            return;
          }
        }
        case 'update': {
          // const strokes = body.edits.map(
          //   edit => new Stroke(edit.color, edit.stroke)
          // );
          // await editor.reset(body.content, strokes);
          return;
        }
        case 'getFileData': {
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
      }
    },
    [messageHandler],
  );
  useEffect(() => {
    const disposable = messageHandler.registerCallback(handler);
    // Signal to VS Code that the webview is initialized.
    messageHandler.postMessage({ type: 'ready' });
    return () => {
      disposable.dispose();
    };
  }, [messageHandler, handler]);
  // Don't render the notebook until we have both model and service manager
  if (isLoading || !model) {
    return <Loader key="notebook-loader" />;
  }

  if (!serviceManager) {
    return (
      <Box
        style={{ height, width: '100%', position: 'relative', padding: '20px' }}
        id="dla-Jupyter-Notebook"
      >
        <Box sx={{ textAlign: 'center' }}>
          <div>Waiting for runtime initialization...</div>
          <div style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
            The notebook requires a runtime to execute code.
          </div>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      style={{ height, width: '100%', position: 'relative' }}
      id="dla-Jupyter-Notebook"
    >
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
        {model && (
          <Notebook2Base
            kernelId={kernelId}
            model={model}
            serviceManager={serviceManager}
          />
        )}
      </Box>
    </Box>
  );
}

// Main function that gets executed once the webview DOM loads
export function main() {
  const root = createRoot(document.getElementById('notebook-editor')!);
  root.render(
    <JupyterReactTheme colormode="dark">
      <NotebookVSCode />
    </JupyterReactTheme>,
  );
}
