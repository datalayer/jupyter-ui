/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { YNotebook } from '@jupyter/ydoc';
import { URLExt } from '@jupyterlab/coreutils';
import type { INotebookContent } from '@jupyterlab/nbformat';
import { NotebookModel } from '@jupyterlab/notebook';
import type { Kernel, ServiceManager } from '@jupyterlab/services';
import { PromiseDelegate } from '@lumino/coreutils';
import { DisposableSet } from '@lumino/disposable';
import { Box } from '@primer/react';
import React, { useEffect, useMemo, useState } from 'react';
import { WebsocketProvider } from 'y-websocket';
import {
  COLLABORATION_ROOM_URL_PATH,
  fetchSessionId,
  requestDocSession,
} from '../../jupyter';
import { newUuid, sleep } from '../../utils';
import { BaseNotebook } from './BaseNotebook';
import type { INotebookProps } from './Notebook';

import './Notebook.css';

export interface ISimpleNotebookProps
  extends Omit<
    INotebookProps,
    | 'collaborative'
    | 'kernel'
    | 'lite'
    | 'serverless'
    | 'useRunningKernelId'
    | 'useRunningKernelIndex'
  > {
  /**
   * Collaboration server providing the document rooms
   */
  collaborationServer:
    | {
        /**
         * Base server URL
         */
        baseURL: string;
        /**
         * JWT token
         */
        token: string;
        /**
         * Server type
         */
        type: 'datalayer';
      }
    | {
        /**
         * Server type
         */
        type: 'jupyter';
      };
  kernelId?: string;
  serviceManager: ServiceManager.IManager;
}

/**
 * Simple notebook component without adapter and stores.
 *
 * Notes:
 * - You must provide the appropriate service manager
 * - You can specified the kernel id to use; if it is not defined or empty and startDefaultKernel is true, a new kernel will be started.
 */
export function SimpleNotebook(
  props: React.PropsWithChildren<ISimpleNotebookProps>
): JSX.Element {
  const {
    Toolbar,
    cellSidebarMargin = 120,
    children,
    collaborationServer,
    extensions = [],
    height = '100vh',
    maxHeight = '100vh',
    nbformat,
    nbgrader = false,
    path,
    readonly = false,
    serviceManager,
    startDefaultKernel = false,
    url,
  } = props;

  const id = useMemo(() => props.id || newUuid(), [props.id]);

  // Define the kernel to be used.
  // - Check the provided kernel id exists
  // - If no kernel found, start a new one if required
  const [kernelId, setKernelId] = useState<string | undefined>(undefined);
  useEffect(() => {
    let isMounted = true;
    let connection: Kernel.IKernelConnection | undefined;
    (async () => {
      let newKernelId: string | undefined;
      await serviceManager.kernels.ready;
      if (props.kernelId) {
        for (const model of serviceManager.kernels.running()) {
          if (model.id === props.kernelId) {
            newKernelId = props.kernelId;
            break;
          }
        }
      }

      if (!newKernelId && startDefaultKernel && isMounted) {
        console.log('Starting new kernel.');
        connection = await serviceManager.kernels.startNew();
        if (isMounted) {
          newKernelId = connection.id;
        } else {
          connection.dispose();
        }
      }

      if (isMounted) {
        setKernelId(newKernelId);
      }
    })();

    return () => {
      isMounted = false;
      connection?.dispose();
    };
  }, [props.kernelId, serviceManager.kernels, startDefaultKernel]);

  // Generate the notebook model
  // There are three posibilities (by priority order):
  // - Connection to a collaborative room
  // - Provided notebook content
  // - Provided URL to fetch notebook content from
  const [model, setModel] = useState<NotebookModel | null>(null);
  useEffect(() => {
    let isMounted = true;
    const disposable = new DisposableSet();

    if (collaborationServer) {
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
        let roomURL = '';
        let roomName = '';
        const params: Record<string, string> = {};

        // Setup Collaboration
        if (collaborationServer.type == 'jupyter') {
          const session = await requestDocSession(
            'json',
            'notebook',
            path!,
            serviceManager.serverSettings
          );
          roomURL = URLExt.join(
            serviceManager?.serverSettings.wsUrl!,
            COLLABORATION_ROOM_URL_PATH
          );
          roomName = `${session.format}:${session.type}:${session.fileId}`;
          params.sessionId = session.sessionId;
          if (serviceManager.serverSettings.token) {
            params.token = serviceManager.serverSettings.token;
          }
        } else if (collaborationServer.type == 'datalayer') {
          const { baseURL, token } = collaborationServer;
          roomName = id;
          const serverURL = URLExt.join(baseURL, `/api/spacer/v1/rooms`);
          roomURL = serverURL.replace(/^http/, 'ws');

          params.sessionId = await fetchSessionId({
            url: URLExt.join(serverURL, roomName),
            token,
          });
          params.token = token;
        }

        if (params.sessionId) {
          provider = new WebsocketProvider(roomURL, roomName, ydoc, {
            disableBc: true,
            params,
            awareness,
          });
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
  }, [collaborationServer, path, readonly, url]);

  return (
    <Box
      style={{ height, width: '100%', position: 'relative' }}
      id="dla-Jupyter-Notebook"
    >
      {Toolbar && <Toolbar notebookId={id} />}
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
        {children}
        {model && serviceManager && (
          <BaseNotebook
            id={id}
            extensions={extensions}
            model={model}
            nbgrader={nbgrader}
            serviceManager={serviceManager}
            kernelId={kernelId}
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
