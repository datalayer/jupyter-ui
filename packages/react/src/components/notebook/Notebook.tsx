/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { YNotebook } from '@jupyter/ydoc';
import { Cell, ICellModel } from '@jupyterlab/cells';
import { URLExt } from '@jupyterlab/coreutils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookContent } from '@jupyterlab/nbformat';
import {
  INotebookModel,
  NotebookModel,
  NotebookPanel,
} from '@jupyterlab/notebook';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { Kernel as JupyterKernel, ServiceManager } from '@jupyterlab/services';
import { CommandRegistry } from '@lumino/commands';
import { PromiseDelegate } from '@lumino/coreutils';
import { Box } from '@primer/react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { WebsocketProvider as YWebsocketProvider } from 'y-websocket';
import {
  jupyterReactStore,
  KernelTransfer,
  OnSessionConnection,
} from '../../state';
import { newUuid, sleep } from '../../utils';
import { asObservable, Lumino } from '../lumino';
import {
  COLLABORATION_ROOM_URL_PATH,
  fetchSessionId,
  ICollaborative,
  Kernel,
  Lite,
  requestDocSession,
  useJupyter,
} from './../../jupyter';
import { CellMetadataEditor } from './cell/metadata';
import { ICellSidebarProps } from './cell/sidebar';
import { INotebookToolbarProps } from './toolbar/NotebookToolbar';
import { NotebookAdapter } from './NotebookAdapter';
import { useNotebookStore } from './NotebookState';
import { Loader } from '../utils';

import './Notebook.css';

export type ExternalIPyWidgets = {
  name: string;
  version: string;
};

export type BundledIPyWidgets = ExternalIPyWidgets & {
  module: any;
};

export type IDatalayerNotebookExtensionProps = {
  notebookId: string;
  commands: CommandRegistry;
  panel: NotebookPanel;
};

export type DatalayerNotebookExtension = DocumentRegistry.IWidgetExtension<
  NotebookPanel,
  INotebookModel
> & {
  init(props: IDatalayerNotebookExtensionProps): void;
  get component(): JSX.Element | null;
};

export type INotebookProps = {
  CellSidebar?: (props: ICellSidebarProps) => JSX.Element;
  Toolbar?: (props: INotebookToolbarProps) => JSX.Element;
  cellMetadataPanel?: boolean;
  cellSidebarMargin?: number;
  collaborative?: ICollaborative;
  extensions?: DatalayerNotebookExtension[];
  height?: string;
  id: string;
  kernel?: Kernel;
  kernelClients?: JupyterKernel.IKernelConnection[];
  kernelTransfer?: KernelTransfer;
  lite?: Lite;
  maxHeight?: string;
  nbformat?: INotebookContent;
  nbgrader?: boolean;
  onSessionConnection?: OnSessionConnection;
  path?: string;
  readonly?: boolean;
  renderId?: number;
  renderers?: IRenderMime.IRendererFactory[];
  serverless: boolean;
  serviceManager?: ServiceManager.IManager;
  startDefaultKernel?: boolean;
  url?: string;
  /**
   * The Kernel Id to use, as defined in the Kernel API.
   */
  useRunningKernelId?: string;
  /**
   * The index (aka position) of the Kernel to use in the list of kernels.
   */
  useRunningKernelIndex?: number;
};

/**
 * This component creates a Notebook as a collection of cells
 * with sidebars.
 *
 * @param props The notebook properties.
 * @returns A Notebook React.js component.
 */
export const Notebook = (props: INotebookProps) => {
  const { serviceManager, defaultKernel, lite } = useJupyter({
    lite: props.lite,
    serverless: props.serverless,
    serviceManager: props.serviceManager,
    startDefaultKernel: props.startDefaultKernel,
    useRunningKernelId: props.useRunningKernelId,
    useRunningKernelIndex: props.useRunningKernelIndex,
  });
  const {
    Toolbar,
    collaborative,
    extensions,
    height,
    maxHeight,
    nbformat,
    nbgrader,
    path,
    readonly,
    serverless,
    url,
  } = props;
  const [id, _] = useState(props.id || newUuid());
  const [adapter, setAdapter] = useState<NotebookAdapter>();
  const [extensionComponents, setExtensionComponents] = useState(
    new Array<JSX.Element>()
  );
  const kernel = props.kernel ?? defaultKernel;
  const notebookStore = useNotebookStore();
  const portals = notebookStore.selectNotebookPortals(id);

  const [isLoading, setIsLoading] = useState(false);

  // Bootstrap the Notebook Adapter.
  const bootstrapAdapter = async (
    serviceManager?: ServiceManager.IManager,
    kernel?: Kernel
  ) => {
    const adapter = new NotebookAdapter({
      ...props,
      id,
      lite,
      kernel,
      serviceManager,
    });
    // Update the local state.
    setAdapter(adapter);
    extensions!.forEach(extension => {
      extension.init({
        notebookId: id,
        commands: adapter.commands,
        panel: adapter.notebookPanel!,
      });
      extension.createNew(adapter.notebookPanel!, adapter.context!);
      setExtensionComponents(
        extensionComponents.concat(extension.component ?? <></>)
      );
    });
    // Update the notebook state with the adapter.
    notebookStore.update({ id, state: { adapter } });
    // Update the notebook state further to events.
    adapter.notebookPanel?.content.modelChanged.connect((notebook, _) => {
      if (notebook.model) {
        notebookStore.changeModel({ id, notebookModel: notebook.model });
      }
    });
    adapter.notebookPanel?.content.activeCellChanged.connect((_, cellModel) => {
      if (cellModel === null) {
        notebookStore.activeCellChange({ id, cellModel: undefined });
      } else {
        notebookStore.activeCellChange({ id, cellModel });
      }
    });
    adapter.notebookPanel?.sessionContext.statusChanged.connect(
      (_, kernelStatus) => {
        notebookStore.changeKernelStatus({ id, kernelStatus });
      }
    );
    // Add more UI behavior when the Service Manager is ready.
    adapter.serviceManager.ready.then(() => {
      if (!readonly) {
        const cellModel = adapter.notebookPanel!.content.activeCell;
        if (cellModel) {
          notebookStore.activeCellChange({ id, cellModel });
        }
        const activeCellChanged$ = asObservable(
          adapter.notebookPanel!.content.activeCellChanged
        );
        activeCellChanged$.subscribe((cellModel: Cell<ICellModel>) => {
          notebookStore.activeCellChange({ id, cellModel });
          const panelDiv = document.getElementById(
            'right-panel-id'
          ) as HTMLDivElement;
          if (panelDiv) {
            const cellMetadataOptions = (
              <Box mt={3}>
                <CellMetadataEditor
                  notebookId={id}
                  cell={cellModel}
                  nbgrader={nbgrader!}
                />
              </Box>
            );
            const portal = createPortal(cellMetadataOptions, panelDiv);
            notebookStore.setPortalDisplay({
              id,
              portalDisplay: { portal, pinned: false },
            });
          }
        });
      }
    });
  };
  //
  const createAdapter = (
    collaborative: ICollaborative,
    serviceManager?: ServiceManager.IManager,
    kernel?: Kernel
  ) => {
    if (!kernel) {
      bootstrapAdapter(serviceManager, kernel);
    } else {
      kernel.ready.then(() => {
        bootstrapAdapter(serviceManager, kernel);
      });
    }
  };
  const disposeAdapter = () => {
    adapter?.notebookPanel?.disposed.connect((slot, _) => {
      if (adapter) {
        notebookStore.dispose(id);
        setAdapter(undefined);
      }
    });
    adapter?.notebookPanel?.dispose();
  };
  // Mutation Effects.
  useEffect(() => {
    if (serviceManager && serverless) {
      createAdapter(collaborative, serviceManager, kernel);
    } else if (serviceManager && kernel) {
      createAdapter(collaborative, serviceManager, kernel);
    }
  }, [collaborative, serviceManager, kernel]);

  useEffect(() => {
    // As the server has the content source of truth, we
    // must ensure that the shared model is pristine before
    // to connect to the server. More over we should ensure,
    // the connection is disposed in case the server room is
    // reset for any reason while the client is still alive.
    let provider: YWebsocketProvider | null = null;
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
            setIsLoading(true);
            Promise.all([connect(), ready.promise, sleep(500)])
              .catch(error => {
                console.error(
                  'Failed to setup collaboration connection.',
                  error
                );
              })
              .finally(() => {
                if (isMounted) {
                  setIsLoading(false);
                }
              });
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
      if (adapter?.notebookPanel && isMounted) {
        sharedModel = new YNotebook();
        const { ydoc, awareness } = sharedModel;
        // Setup Collaboration.
        if (collaborative == 'jupyter') {
          const token =
            jupyterReactStore.getState().jupyterConfig?.jupyterServerToken;
          const session = await requestDocSession('json', 'notebook', path!);
          const roomURL = URLExt.join(
            serviceManager?.serverSettings.wsUrl!,
            COLLABORATION_ROOM_URL_PATH
          );
          const roomName = `${session.format}:${session.type}:${session.fileId}`;
          provider = new YWebsocketProvider(roomURL, roomName, ydoc, {
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

          provider = new YWebsocketProvider(
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
          const oldModel = adapter.notebookPanel.content.model;
          adapter.notebookPanel.content.model = model;
          // We must dispose the old model after setting the new one.
          oldModel?.dispose();
        }
      }
    };

    if (collaborative) {
      setIsLoading(true);
      Promise.all([connect(), ready.promise, sleep(500)])
        .catch(error => {
          console.error('Failed to setup collaboration connection.', error);
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        });
    }

    return () => {
      isMounted = false;
      if (provider) {
        (provider.synced ? Promise.resolve() : ready.promise).finally(() => {
          provider?.off('sync', onSync);
          provider?.off('connection-close', onConnectionClose);
          provider?.disconnect();
          provider?.destroy();
        });
      }
      sharedModel?.dispose();
    };

  }, [adapter?.notebookPanel, collaborative]);

  useEffect(() => {
    if (adapter && adapter.kernel !== kernel) {
      adapter.setKernel(kernel);
    }
  }, [kernel]);
  useEffect(() => {
    if (adapter && adapter.readonly !== readonly) {
      adapter.setReadonly(readonly!);
    }
  }, [readonly]);
  useEffect(() => {
    if (adapter && adapter.serverless !== serverless) {
      adapter.setServerless(serverless);
    }
  }, [serverless]);
  useEffect(() => {
    if (adapter && adapter.nbformat !== nbformat) {
      adapter.setNbformat(nbformat);
    }
  }, [nbformat]);
  useEffect(() => {
    if (adapter && path && adapter.path !== path) {
      disposeAdapter();
      createAdapter(collaborative, serviceManager);
    }
  }, [path]);
  useEffect(() => {
    if (adapter && url && adapter.url !== url) {
      disposeAdapter();
      createAdapter(collaborative, serviceManager);
    }
  }, [collaborative, url]);
  // Dispose Effects.
  useEffect(() => {
    return () => {
      disposeAdapter();
    };
  }, []);
  //
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
            width: `calc(100% - ${props.cellSidebarMargin!}px)`,
          },
          '& .jp-Notebook-footer': {
            width: `calc(100% - ${props.cellSidebarMargin! + 82}px)`,
          },
          '& .jp-Cell .jp-CellHeader': {
            position: 'absolute',
            top: '-5px',
            left: `${props.cellSidebarMargin! + 10}px`,
            height: 'auto',
          },
          '& .jp-Cell .dla-CellSidebar-Container': {
            padding: '4px 8px',
            width: `${props.cellSidebarMargin! + 10}px`,
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
        <Box>
          {extensionComponents.map((extensionComponent, index) => {
            return (
              <Box key={`${extensionComponent}-${index}`}>
                {extensionComponent}
              </Box>
            );
          })}
        </Box>
        {isLoading ? (
          <Loader />
        ) : (
          <Box>{adapter && <Lumino id={id}>{adapter.panel}</Lumino>}</Box>
        )}
      </Box>
    </Box>
  );
};

Notebook.defaultProps = {
  cellMetadataPanel: false,
  cellSidebarMargin: 120,
  collaborative: undefined,
  extensions: [],
  height: '100vh',
  kernelClients: [],
  maxHeight: '100vh',
  nbgrader: false,
  readonly: false,
  renderId: 0,
  renderers: [],
  serverless: false,
  startDefaultKernel: false,
} as Partial<INotebookProps>;

export default Notebook;
