import { YNotebook } from '@jupyter/ydoc';
import { URLExt } from '@jupyterlab/coreutils';
import type { INotebookContent } from '@jupyterlab/nbformat';
import { NotebookModel } from '@jupyterlab/notebook';
import { PromiseDelegate } from '@lumino/coreutils';
import { DisposableSet } from '@lumino/disposable';
import { Box } from '@primer/react';
import React, { useEffect, useMemo, useState } from 'react';
import { WebsocketProvider } from 'y-websocket';
import {
  COLLABORATION_ROOM_URL_PATH,
  fetchSessionId,
  requestDocSession,
  useJupyter,
} from '../../jupyter';
import { jupyterReactStore } from '../../state';
import { newUuid, sleep } from '../../utils';
import { BaseNotebook } from './BaseNotebook';
import type { INotebookProps } from './Notebook';
import useNotebookStore from './NotebookState';


export function SimpleNotebook(props: INotebookProps): JSX.Element {
  const {
    Toolbar,
    cellSidebarMargin = 120,
    collaborative,
    extensions = [],
    height = '100vh',
    maxHeight = '100vh',
    nbformat,
    nbgrader,
    path,
    readonly,
    serverless = false,
    startDefaultKernel = false,
    url,
  } = props;

  const { serviceManager, defaultKernel } = useJupyter({
    lite: props.lite,
    serverless,
    serviceManager: props.serviceManager,
    startDefaultKernel,
    useRunningKernelId: props.useRunningKernelId,
    useRunningKernelIndex: props.useRunningKernelIndex,
  });

  const id = useMemo(() => props.id || newUuid(), [props.id]);
  const kernel = props.kernel ?? defaultKernel;
  const notebookStore = useNotebookStore();
  const portals = notebookStore.selectNotebookPortals(id);

  // Generate the notebook model
  // There are three posibilities (by priority order):
  // - Connection to a collaborative room
  // - Provided notebook content
  // - Provided URL to fetch notebook content from
  const [model, setModel] = useState<NotebookModel | null>(null);
  useEffect(() => {
    let isMounted = true;
    const disposable = new DisposableSet();

    if (collaborative) {
      // As the server has the content source of thruth, we
      // must ensure that the shared model is pristine before
      // to connect to the server. More over we should ensure,
      // the connection is disposed in case the server room is
      // reset for any reason while the client is still alive.
      let provider: WebsocketProvider | null = null;
      let ready = new PromiseDelegate();
      let isMounted = true;
      let sharedModel: YNotebook | null = null;

      const onConnectionClose = (event: any) => {
        if (event.code > 1000) {
          console.error(
            'Connection with the room has been closed unexpectedly.',
            event
          );

          provider?.disconnect();

          // If sessionId has expired - reset the client model
          if (event.code === 4002) {
            provider?.destroy();
            ready.reject('Connection closed.');
            ready = new PromiseDelegate();
            if (isMounted) {
              Promise.all([connect(), ready.promise, sleep(500)]).catch(
                error => {
                  console.error(
                    'Failed to setup collaboration connection.',
                    error
                  );
                }
              );
            }
          }

          // FIXME inform the user.
        }
      };

      const onSync = (isSynced: boolean) => {
        if (isSynced) {
          provider?.off('sync', onSync);
          ready.resolve(void 0);
        }
      };

      const connect = async () => {
        sharedModel = new YNotebook();
        const { ydoc, awareness } = sharedModel;
        // Setup Collaboration
        if (collaborative == 'jupyter') {
          const token =
            jupyterReactStore.getState().jupyterConfig?.jupyterServerToken;
          const session = await requestDocSession('json', 'notebook', path!);
          const roomURL = URLExt.join(
            serviceManager?.serverSettings.wsUrl!,
            COLLABORATION_ROOM_URL_PATH
          );
          const roomName = `${session.format}:${session.type}:${session.fileId}`;
          provider = new WebsocketProvider(roomURL, roomName, ydoc, {
            disableBc: true,
            params: {
              sessionId: session.sessionId,
              token: token!,
            },
            awareness,
          });
        } else if (collaborative == 'datalayer') {
          const { runUrl, token } =
            jupyterReactStore.getState().datalayerConfig ?? {};
          const roomName = id;
          const roomURL = URLExt.join(runUrl!, `/api/spacer/v1/rooms`);

          const sessionId = await fetchSessionId({
            url: URLExt.join(roomURL, roomName),
            token,
          });

          provider = new WebsocketProvider(
            roomURL.replace(/^http/, 'ws'),
            roomName,
            ydoc,
            {
              disableBc: true,
              params: {
                sessionId,
                token: token!,
              },
              awareness,
            }
          );
        }
        if (provider) {
          provider.on('sync', onSync);
          provider.on('connection-close', onConnectionClose);
          console.log('Collaboration is setup with websocket provider.');
          // Create a new model using the one synchronize with the collaboration room
          const model = new NotebookModel({
            collaborationEnabled: true,
            disableDocumentWideUndoRedo: true,
            sharedModel,
          });
          model.readOnly = readonly;
          setModel(model);
        }
      };

      Promise.all([connect(), ready.promise])
        .then(() => {
          if (provider) {
            const dispose = () => {
              (provider!.synced ? Promise.resolve() : ready.promise).finally(
                () => {
                  provider!.off('sync', onSync);
                  provider!.off('connection-close', onConnectionClose);
                  provider!.disconnect();
                  provider!.destroy();
                }
              );
            };
            if (isMounted) {
              disposable.add(Object.freeze({ dispose, isDisposed: false }));
            } else {
              dispose();
            }
          }
        })
        .catch(error => {
          console.error('Failed to setup collaboration connection.', error);
        });
    } else {
      const createModel = (nbformat: INotebookContent | undefined) => {
        const model = new NotebookModel();
        if (nbformat) {
          nbformat.cells.forEach(cell => {
            cell.metadata['editable'] = !this._readonly;
          });
          model.fromJSON(nbformat);
        }
        model.readOnly = readonly;
        setModel(model);
      };

      if (!nbformat && url) {
        loadFromUrl(url).then(nbformat => {
          if (isMounted) {
            createModel(nbformat);
          }
        });
      } else {
        createModel(nbformat);
      }
    }

    return () => {
      isMounted = false;
      disposable.dispose();
    };
  }, [collaborative, path, readonly, url]);

  return (
    <Box
      style={{ height, width: '100%', position: 'relative' }}
      id="dla-Jupyter-Notebook"
    >
      {Toolbar && <Toolbar notebookId={id} />}
      <Box
        className="dla-Box-Notebook"
        sx={{
          '& .dla-Jupyter-Notebook': {
            height,
            maxHeight,
            width: '100%',
            overflowY: 'hidden',
          },
          '& .datalayer-NotebookPanel-header': {
            minHeight: '50px',
          },
          '& .jp-Notebook': {
            flex: '1 1 auto !important',
            height: '100%',
            overflowY: 'scroll',
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
          '& .jp-Cell .jp-CellHeader': {
            position: 'absolute',
            top: '-5px',
            left: `${cellSidebarMargin + 10}px`,
            height: 'auto',
          },
          '& .jp-Cell .dla-CellSidebar-Container': {
            padding: '4px 8px',
            width: `${cellSidebarMargin + 10}px`,
            marginLeft: 'auto',
          },
          '& .jp-CodeMirrorEditor': {
            cursor: 'text !important',
          },
          '.dla-Box-Notebook': {
            position: 'relative',
          },
        }}
      >
        <>{portals?.map((portal: React.ReactPortal) => portal)}</>
        {model && serviceManager && (
          <BaseNotebook
            id={id}
            extensions={extensions}
            model={model}
            nbgrader={nbgrader}
            serviceManager={serviceManager}
            kernelId={kernel?.id}
            path={path}
          />
        )}
      </Box>
    </Box>
  );
}

async function loadFromUrl(url: string) {
  return fetch(url)
    .then(response => {
      return response.text();
    })
    .then(nb => {
      return JSON.parse(nb);
    });
}
