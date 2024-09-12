/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Box } from '@primer/react';
import { Cell, ICellModel } from '@jupyterlab/cells';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { INotebookContent } from '@jupyterlab/nbformat';
import { ServiceManager } from '@jupyterlab/services';
import { useJupyter, Lite } from './../../jupyter/JupyterContext';
import { Kernel } from '../../jupyter/kernel/Kernel';
import { asObservable, Lumino } from '../lumino';
import { CellMetadataEditor } from './cell/metadata/CellMetadataEditor';
import { ICellSidebarProps } from './cell/sidebar/CellSidebarWidget';
import { INotebookToolbarProps } from './toolbar/NotebookToolbar';
import { newUuid } from '../../utils/Utils';
import { useNotebookStore } from './NotebookState';
import { NotebookAdapter } from './NotebookAdapter';

import './Notebook.css';

export type ExternalIPyWidgets = {
  name: string;
  version: string;
};

export type BundledIPyWidgets = ExternalIPyWidgets & {
  module: any;
};

export type INotebookProps = {
  CellSidebar?: (props: ICellSidebarProps) => JSX.Element;
  Toolbar?: (props: INotebookToolbarProps) => JSX.Element;
  cellMetadataPanel: boolean;
  cellSidebarMargin: number;
  height?: string;
  id: string;
  lite?: Lite;
  kernel?: Kernel;
  maxHeight?: string;
  nbformat?: INotebookContent;
  nbgrader: boolean;
  path?: string;
  readonly: boolean;
  renderers: IRenderMime.IRendererFactory[];
  serverless: boolean,
  serviceManager?: ServiceManager.IManager,
  url?: string;
};

/**
 * This component creates a Notebook as a collection of snippets
 * with sidebars.
 *
 * @param props The notebook properties.
 * @returns A Notebook React.js component.
 */
export const Notebook = (props: INotebookProps) => {
  const { serviceManager, defaultKernel, kernelManager, lite } = useJupyter({
    serverless: props.serverless,
    serviceManager: props.serviceManager,
    lite: props.lite,
  });
  const {
    Toolbar,
    height,
    maxHeight,
    nbformat,
    nbgrader,
    path,
    readonly,
  } = props;
  const notebookStore = useNotebookStore();
  const [id, _] = useState(props.id ?? newUuid());
  const [adapter, setAdapter] = useState<NotebookAdapter>();
  const kernel = props.kernel ?? defaultKernel;
//  const notebook = notebookStore.selectNotebook(id);
  const portals = notebookStore.selectNotebookPortals(id);
  const createAdapter = (kernel: Kernel) => {
    kernel.ready.then(() => {
      const adapter = new NotebookAdapter(
        {
          ...props,
          id,
          lite: lite || props.lite,
          kernel,
          serviceManager: serviceManager ?? props.serviceManager,
        },
      );
      setAdapter(adapter);
      notebookStore.update({
        id,
        state: { adapter }
      });
      adapter.serviceManager.ready.then(() => {
        if (!readonly) {
          const activeCell = adapter.notebookPanel!.content.activeCell;
          if (activeCell) {
            notebookStore.activeCellChange({
              id,
              cellModel: activeCell,
            });
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
                    nbgrader={nbgrader}
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
        adapter.notebookPanel?.model?.contentChanged.connect(
          (notebookModel, _) => {
            notebookStore.changeModel({ id, notebookModel });
          }
        );
        /*
        adapter.notebookPanel?.model!.sharedModel.changed.connect((_, notebookChange) => {
          notebookStore.notebookChange({ id, notebookChange });
        });
        adapter.notebookPanel?.content.modelChanged.connect((notebook, _) => {
          dispatÅch(notebookStore.notebookChange({ id, notebook }));
        });
        */
        adapter.notebookPanel?.content.activeCellChanged.connect(
          (_, cellModel) => {
            if (cellModel === null) {
              notebookStore.activeCellChange({
                id,
                cellModel: undefined,
              });
            } else {
              notebookStore.activeCellChange({ id, cellModel });
            }
          }
        );
        adapter.notebookPanel?.sessionContext.statusChanged.connect(
          (_, kernelStatus) => {
            notebookStore.changeKernelStatus({ id, kernelStatus });
          }
        );
      });
    });
  };
  const disposeAdapter = () => {
    if (adapter) {
      notebookStore.dispose(id);
    }
  }
  useEffect(() => {
    if (id && serviceManager && kernelManager && kernel) {
      createAdapter(kernel);
    }
    return () => {
      disposeAdapter();
    };
  }, [id, serviceManager, kernelManager, kernel, lite]);
  useEffect(() => {
    if (adapter && nbformat) {
      adapter.setNbformat(nbformat);
    }
  }, [adapter, nbformat]);
  useEffect(() => {
    if (adapter) {
    }
  }, [adapter, path]);
  useEffect(() => {
    if (adapter) {
      adapter.setReadonly(readonly);
    }
  }, [adapter, readonly]);
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
          '& .jp-Cell .dla-CellHeader-Container': {
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
          {adapter && <Lumino id={path}>{adapter.panel}</Lumino>}
        </Box>
      </Box>
    </Box>
  );
};

Notebook.defaultProps = {
  cellMetadataPanel: false,
  cellSidebarMargin: 120,
  height: '100vh',
  maxHeight: '100vh',
  nbgrader: false,
  readonly: false,
  renderers: [],
  serverless: false,
} as Partial<INotebookProps>;

export default Notebook;
