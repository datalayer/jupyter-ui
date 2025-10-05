/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { YNotebook } from '@jupyter/ydoc';
import { Cell, ICellModel } from '@jupyterlab/cells';
import { createGlobalStyle } from 'styled-components';
import { INotebookContent } from '@jupyterlab/nbformat';
import { NotebookModel } from '@jupyterlab/notebook';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { Kernel as JupyterKernel, ServiceManager } from '@jupyterlab/services';
import { Box } from '@primer/react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { KernelTransfer, OnSessionConnection } from '../../state';
import { newUuid } from '../../utils';
import { asObservable, Lumino } from '../lumino';
import {
  ICollaborationProvider,
  CollaborationStatus,
  Kernel,
  Lite,
  useJupyter,
} from './../../jupyter';
import { CellMetadataEditor } from './cell/metadata';
import { NotebookAdapter } from './NotebookAdapter';
import { useNotebookStore } from './NotebookState';
import { INotebookToolbarProps } from './toolbar';
import { Loader } from '../utils';
import { NotebookExtension } from './NotebookExtensions';

import './Notebook.css';

export type ExternalIPyWidgets = {
  name: string;
  version: string;
};

export type BundledIPyWidgets = ExternalIPyWidgets & {
  module: any;
};

const GlobalStyle = createGlobalStyle<any>`
  .dla-Box-Notebook .jp-Cell .dla-CellSidebar-Container {
    display: none;
  }
  .dla-Box-Notebook .jp-Cell.jp-mod-active .dla-CellSidebar-Container {
    display: block;
  }
`;

export type INotebookProps = {
  Toolbar?: (props: INotebookToolbarProps) => JSX.Element;
  cellMetadataPanel?: boolean;
  cellSidebarMargin?: number;
  collaborationProvider?: ICollaborationProvider;
  extensions?: NotebookExtension[];
  height?: string;
  id: string;
  kernel?: Kernel;
  kernelClients?: JupyterKernel.IKernelConnection[];
  kernelTransfer?: KernelTransfer;
  lite?: Lite;
  maxHeight?: string;
  nbformat?: INotebookContent;
  onSessionConnection?: OnSessionConnection;
  path?: string;
  readonly?: boolean;
  renderId?: number;
  renderers?: IRenderMime.IRendererFactory[];
  serverless: boolean;
  serviceManager?: ServiceManager.IManager;
  startDefaultKernel?: boolean;
  url?: string;
  useVSCodeTheme?: boolean; // Enable VS Code theme integration when available
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
    collaborationProvider: collaborationProviderProp,
    extensions,
    height,
    maxHeight,
    nbformat,
    path,
    readonly,
    serverless,
    url,
  } = props;
  const [id, _] = useState(props.id || newUuid());
  const [adapter, setAdapter] = useState<NotebookAdapter>();
  const [isLoading, setIsLoading] = useState(false);
  const [extensionComponents, setExtensionComponents] = useState(
    new Array<JSX.Element>()
  );
  const kernel = props.kernel ?? defaultKernel;
  const notebookStore = useNotebookStore();
  const portals = notebookStore.selectNotebookPortals(id);

  // Bootstrap the Notebook Adapter.
  const bootstrapAdapter = async (
    //    collaborative: ICollaborative,
    serviceManager?: ServiceManager.IManager,
    kernel?: Kernel
  ) => {
    console.log('bootstrapAdapter called with kernel:', kernel);
    const adapter = new NotebookAdapter({
      ...props,
      id,
      lite,
      kernel,
      serviceManager,
    });
    console.log('Created adapter:', adapter);
    // Update the local state.
    setAdapter(adapter);
    extensions!.forEach(extension => {
      extension.init({
        notebookId: id,
        commands: adapter.commands,
        panel: adapter.notebookPanel!,
        adapter,
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
                <CellMetadataEditor cellModel={cellModel.model} />
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
    // fix: issue-396 When `serviceManager` changes, the `Notebook` component will recreate the `NotebookAdapter` instance. The old `NotebookAdapter` is not properly disposed, causing shortcut key listener conflicts.
    if (adapter) {
      adapter.dispose();
      setAdapter(undefined);
    }
    if (serviceManager && serverless) {
      createAdapter(serviceManager, kernel);
    } else if (serviceManager && kernel) {
      createAdapter(serviceManager, kernel);
    }
  }, [serviceManager, kernel]);

  useEffect(() => {
    // Set up collaboration using the new provider system
    let collaborationProvider: ICollaborationProvider | null = null;
    let isMounted = true;
    let sharedModel: YNotebook | null = null;

    const connect = async () => {
      if (!adapter?.notebookPanel || !isMounted) {
        return;
      }

      // Use the provided collaboration provider
      if (collaborationProviderProp) {
        collaborationProvider = collaborationProviderProp;
      }

      if (!collaborationProvider) {
        return;
      }

      try {
        sharedModel = new YNotebook();

        // Set up event handlers
        const handleStatusChange = (
          _: ICollaborationProvider,
          status: CollaborationStatus
        ) => {
          if (
            status === CollaborationStatus.Connected &&
            adapter?.notebookPanel
          ) {
            // Create a new model using the synchronized shared model
            const model = new NotebookModel({
              collaborationEnabled: true,
              disableDocumentWideUndoRedo: true,
              sharedModel: sharedModel!,
            });

            // Store the old model for disposal
            const oldModel = adapter.notebookPanel.content.model;

            // Safely update the model
            try {
              // Update the model without triggering widget reattachment
              adapter.notebookPanel.content.model = model;

              // Update the notebook store with the new model
              notebookStore.changeModel({ id, notebookModel: model });

              // Force the notebook panel to update its content
              adapter.notebookPanel.update();

              // Dispose the old model after successful update
              if (oldModel && oldModel !== model) {
                oldModel.dispose();
              }

              console.log(
                'Notebook model updated with collaboration. Cell count:',
                model.cells?.length
              );
            } catch (error) {
              console.error('Error updating notebook model:', error);
              // Restore the old model if update fails
              if (oldModel && !oldModel.isDisposed) {
                adapter.notebookPanel.content.model = oldModel;
              }
            }
          }
        };

        const handleError = (_: ICollaborationProvider, error: Error) => {
          console.error('Collaboration error:', error);
          // Handle collaboration errors
          if (error.message.includes('session expired')) {
            // Attempt to reconnect
            if (isMounted && collaborationProvider && sharedModel) {
              collaborationProvider
                .connect(sharedModel, id)
                .catch(console.error);
            }
          }
        };

        collaborationProvider.events.statusChanged.connect(handleStatusChange);
        collaborationProvider.events.errorOccurred.connect(handleError);

        // Connect to collaboration service
        await collaborationProvider.connect(sharedModel, id, {
          serviceManager,
          path: props.path, // Pass the notebook's path to the collaboration provider
        });

        console.log(
          'Collaboration is setup with provider:',
          collaborationProvider.type
        );
      } catch (error) {
        console.error('Failed to setup collaboration:', error);
        setIsLoading(false);
      }
    };

    if (collaborationProviderProp) {
      // Don't set isLoading to true here as it causes the Lumino widget to unmount
      // setIsLoading(true);
      connect()
        .catch(error => {
          console.error('Failed to setup collaboration connection.', error);
        })
        .finally(() => {
          if (isMounted) {
            // setIsLoading(false);
          }
        });
    }

    return () => {
      isMounted = false;
      collaborationProvider?.dispose();
      sharedModel?.dispose();
    };
  }, [adapter?.notebookPanel, collaborationProviderProp]);

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
      createAdapter(serviceManager);
    }
  }, [path]);
  useEffect(() => {
    if (adapter && url && adapter.url !== url) {
      disposeAdapter();
      createAdapter(serviceManager);
    }
  }, [url]);
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
          '& .jp-CodeMirrorEditor': {
            cursor: 'text !important',
          },
          '.dla-Box-Notebook': {
            position: 'relative',
          },
        }}
      >
        <>{portals?.map((portal: React.ReactPortal) => portal)}</>
        <GlobalStyle />
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
          <Box>
            {adapter ? (
              <Lumino id={id}>{adapter.panel}</Lumino>
            ) : (
              <div>No adapter available</div>
            )}
          </Box>
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
