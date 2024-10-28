/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Box } from '@primer/react';
import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import { Cell, ICellModel } from '@jupyterlab/cells';
import { CommandRegistry } from '@lumino/commands';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { INotebookContent } from '@jupyterlab/nbformat';
import { ServiceManager } from '@jupyterlab/services';
import { useJupyter, Lite, Kernel } from './../../jupyter';
import { asObservable, Lumino } from '../lumino';
import { CellMetadataEditor } from './cell/metadata';
import { ICellSidebarProps } from './cell/sidebar';
import { INotebookToolbarProps } from './toolbar/NotebookToolbar';
import { newUuid } from '../../utils';
import { OnKernelConnection } from '../../state';
import { useNotebookStore } from './NotebookState';
import { NotebookAdapter } from './NotebookAdapter';

import './Notebook.css';

export type ExternalIPyWidgets = {
  name: string;
  version: string;
}

export type BundledIPyWidgets = ExternalIPyWidgets & {
  module: any;
}

export type IDatalayerNotebookExtensionProps = {
  notebookId: string;
  commands: CommandRegistry;
};

export type DatalayerNotebookExtension = DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> & {
  init(props: IDatalayerNotebookExtensionProps): void;
  get component(): JSX.Element | undefined;
}

export type INotebookProps = {
  CellSidebar?: (props: ICellSidebarProps) => JSX.Element;
  Toolbar?: (props: INotebookToolbarProps) => JSX.Element;
  cellMetadataPanel: boolean;
  cellSidebarMargin: number;
  extensions: DatalayerNotebookExtension[]
  height?: string;
  id: string;
  lite?: Lite;
  kernel?: Kernel;
  maxHeight?: string;
  nbformat?: INotebookContent;
  nbgrader: boolean;
  onKernelConnection?: OnKernelConnection;
  path?: string;
  readonly: boolean;
  renderId: number;
  renderers: IRenderMime.IRendererFactory[];
  serverless: boolean,
  serviceManager?: ServiceManager.IManager,
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
    useRunningKernelId: props.useRunningKernelId,
    useRunningKernelIndex: props.useRunningKernelIndex,
  });
  const {
    Toolbar,
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
  const [extensionComponents, setExtensionComponents] = useState(new Array<JSX.Element>());
  const kernel = props.kernel ?? defaultKernel;
  const notebookStore = useNotebookStore();
  const portals = notebookStore.selectNotebookPortals(id);
  // Bootstrap the Notebook Adapter.
  const bootstrapAdapter = (serviceManager?: ServiceManager.IManager, kernel?: Kernel) => {
    const adapter = new NotebookAdapter({
      ...props,
      id,
      lite,
      kernel,
      serviceManager,
    });
    // Update the local state.
    setAdapter(adapter);
    extensions.forEach(extension => {
      extension.init({
        notebookId: id,
        commands: adapter.commands,
      })
      extension.createNew(adapter.notebookPanel!, adapter.context!);
      setExtensionComponents(extensionComponents.concat(extension.component ?? <></>));
    });
    // Update the global state.
    notebookStore.update({ id, state: { adapter } });
    // Update the global state based on events.
    adapter.notebookPanel?.model?.contentChanged.connect((notebookModel, _) => {
      notebookStore.changeModel({ id, notebookModel })
    });
    /*
    adapter.notebookPanel?.model!.sharedModel.changed.connect((_, notebookChange) => {
      notebookStore.notebookChange({ id, notebookChange });
    });
    adapter.notebookPanel?.content.modelChanged.connect((notebook, _) => {
      dispatÅch(notebookStore.notebookChange({ id, notebook }));
    });
    */
    adapter.notebookPanel?.content.activeCellChanged.connect((_, cellModel) => {
      if (cellModel === null) {
        notebookStore.activeCellChange({ id, cellModel: undefined });
      } else {
        notebookStore.activeCellChange({ id, cellModel });
      }
    });
    adapter.notebookPanel?.sessionContext.statusChanged.connect((_, kernelStatus) => {
      notebookStore.changeKernelStatus({ id, kernelStatus });
    });
    // Add more UI behavior when the Service Manager is ready...
    adapter.serviceManager.ready.then(() => {
      if (!readonly) {
        const cellModel = adapter.notebookPanel!.content.activeCell;
        if (cellModel) {
          notebookStore.activeCellChange({ id, cellModel });
        }
        const activeCellChanged$ = asObservable(adapter.notebookPanel!.content.activeCellChanged);
        activeCellChanged$.subscribe((cellModel: Cell<ICellModel>) => {
          notebookStore.activeCellChange({ id, cellModel });
          const panelDiv = document.getElementById('right-panel-id') as HTMLDivElement;
          if (panelDiv) {
            const cellMetadataOptions = (
              <Box mt={3}>
                <CellMetadataEditor
                  notebookId={id}
                  cell={cellModel}
                  nbgrader={nbgrader}
                />
              </Box>
            );
            const portal = createPortal(cellMetadataOptions, panelDiv);
            notebookStore.setPortalDisplay({ id, portalDisplay: { portal, pinned: false } });
          }
        });
      }
    });
  }
  //
  const createAdapter = (serviceManager?: ServiceManager.IManager, kernel?: Kernel) => {
    if (!kernel) {
      bootstrapAdapter(serviceManager, kernel);
    } else {
      kernel.ready.then(() => {
        bootstrapAdapter(serviceManager, kernel);
      });
    }
  }
  const disposeAdapter = () => {
    adapter?.notebookPanel?.disposed.connect((slot, _) => {
      if (adapter) {
        notebookStore.dispose(id);
        setAdapter(undefined);
      }
    });
    adapter?.notebookPanel?.dispose();
  }
  // Mutation Effects.
  useEffect(() => {
    if (serviceManager && serverless) {
      createAdapter(serviceManager, kernel);
    }
    else if (serviceManager && kernel) {
      createAdapter(serviceManager, kernel);
    }
  }, [serviceManager, kernel]);
  useEffect(() => {
    if (adapter && adapter.kernel !== kernel) {
      adapter.setKernel(kernel);
    }
  }, [kernel]);
  useEffect(() => {
    if (adapter && adapter.readonly !== readonly) {
      adapter.setReadonly(readonly);
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
    }
  }, []);
  //
  return (
    <Box style={{ height, width: '100%', position: 'relative' }} id="dla-Jupyter-Notebook">
      {Toolbar && <Toolbar notebookId={id} />}
      <Box className="dla-Box-Notebook"
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
            width: `calc(100% - ${props.cellSidebarMargin}px)`,
          },
          '& .jp-Notebook-footer': {
            width: `calc(100% - ${props.cellSidebarMargin + 82}px)`,
          },
          '& .jp-Cell .jp-CellHeader': {
            position: 'absolute',
            top: '-5px',
            left: `${props.cellSidebarMargin + 10}px`,
            height: 'auto',
          },
          '& .jp-Cell .dla-CellSidebar-Container': {
            padding: '4px 8px',
            width: `${props.cellSidebarMargin + 10}px`,
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
        <>
          {portals?.map((portal: React.ReactPortal) => portal)}
        </>
        <Box>
          {extensionComponents.map((extensionComponent, index) => {
            return (
              <Box key={`${extensionComponent}-${index}`}>
                {extensionComponent}
              </Box>
            )}
          )}
        </Box>
        <Box>
          {adapter &&
            <Lumino id={id}>
              {adapter.panel}
            </Lumino>
          }
        </Box>
      </Box>
    </Box>
  );
}

Notebook.defaultProps = {
  cellMetadataPanel: false,
  cellSidebarMargin: 120,
  extensions: [],
  height: '100vh',
  maxHeight: '100vh',
  nbgrader: false,
  readonly: false,
  renderId: 0,
  renderers: [],
  serverless: false,
} as Partial<INotebookProps>;

export default Notebook;
