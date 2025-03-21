import {
  BaseNotebook,
  JupyterReactTheme,
  Loader,
  useKernelId,
  useNotebookModel,
} from '@datalayer/jupyter-react';
import { ServiceManager } from '@jupyterlab/services';
import { Box, Button } from '@primer/react';
import { WebSocket } from 'mock-socket';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MessageHandlerContext, type ExtensionMessage } from './messageHandler';
import { fetch } from './serviceManager';

function App(): JSX.Element {
  const height = '100vh';
  const maxHeight = '100vh';
  const cellSidebarMargin = '120px';
  const messageHandler = useContext(MessageHandlerContext);

  const [isLoading, setIsLoading] = useState(true);
  const [nbformat, setNbformat] = useState(undefined);
  const [readonly, setReadonly] = useState(true);
  const [serviceManager, setServiceManager] = useState<
    ServiceManager | undefined
  >();

  const kernelId = useKernelId({
    kernels: serviceManager?.kernels,
    startDefaultKernel: true,
  });

  const model = useNotebookModel({
    nbformat,
    readonly,
  });

  useEffect(() => {
    if (model) {
      setIsLoading(false);
    }
  }, [model]);

  const handler = useCallback(
    async (message: ExtensionMessage) => {
      const { type, body, requestId } = message;
      switch (type) {
        case 'init': {
          // FIXME
          // editor.setEditable(body.editable);
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
    [messageHandler]
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
    setServiceManager(
      new ServiceManager({
        serverSettings: {
          appendToken: true,
          baseUrl,
          appUrl: '',
          fetch: fetch,
          Headers: Headers,
          init: {
            cache: 'no-store',
            // credentials: 'same-origin',
          } as any,
          Request: Request,
          token,
          WebSocket: WebSocket,
          wsUrl: baseUrl.replace(/^http/, 'ws'),
        },
      })
    );
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
        {model && (
          <BaseNotebook
            kernelId={kernelId}
            model={model}
            // serviceManager={serviceManager}
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
    <JupyterReactTheme>
      <App />
    </JupyterReactTheme>
  );
}

function loadFromBytes(raw: Uint8Array): any {
  const rawContent = new TextDecoder().decode(raw);
  const parsed = JSON.parse(rawContent);
  // Inline html output to fix an issue seen in JupyterLab 4 (prior to 4.2)
  for (const cell of parsed.cells) {
    if (cell.outputs) {
      for (const output of cell.outputs) {
        if (Array.isArray(output.data?.['text/html'])) {
          output.data['text/html'] = output.data['text/html'].join('');
        }
      }
    }
  }
  return parsed;
}
