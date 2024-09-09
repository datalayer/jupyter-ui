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
import { useJupyter } from './../../jupyter/JupyterContext';
import { Kernel } from '../../jupyter/kernel/Kernel';
import Lumino from '../lumino/Lumino';
import { asObservable } from '../lumino/LuminoObservable';
import { CellSidebarProps } from './cell/sidebar/CellSidebarWidget';
import CellMetadataEditor from './cell/metadata/CellMetadataEditor';
import { newUuid } from '../../utils/Utils';
import NotebookAdapter from './NotebookAdapter';
import useNotebookStore from './NotebookState';

import './Notebook.css';

export type ExternalIPyWidgets = {
  name: string;
  version: string;
};

export type BundledIPyWidgets = ExternalIPyWidgets & {
  module: any;
};

export type INotebookProps = {
  cellMetadataPanel: boolean;
  cellSidebarMargin: number;
  height?: string;
  /*
  Example:
    bundledIPyWidgets={[
      {
        name: 'jupyter-matplotlib',
        version: '0.11.3',
        module: require('jupyter-matplotlib'),
      },
    ]}
  */
  bundledIPyWidgets?: BundledIPyWidgets[];
  /*
  Example:
    externalIPyWidgets={[
      { name: '@widgetti/jupyter-react', version: '0.3.0' },
      { name: 'bqplot', version: '0.5.42' },
      { name: 'jupyter-leaflet', version: '0.18.0' },
      { name: 'jupyter-matplotlib', version: '0.11.3' },
    ]}
  */
  externalIPyWidgets?: ExternalIPyWidgets[];
  kernel?: Kernel;
  maxHeight?: string;
  nbformat?: INotebookContent;
  nbgrader: boolean;
  path?: string;
  readOnly: boolean;
  renderers: IRenderMime.IRendererFactory[];
  id: string;
  url?: string;
  CellSidebar?: (props: CellSidebarProps) => JSX.Element;
  Toolbar?: (props: any) => JSX.Element;
};

/**
 * This component creates a Notebook as a collection of snippets
 * with sidebars.
 *
 * @param props The notebook properties.
 * @returns A Notebook React.js component.
 */
export const Notebook = (props: INotebookProps) => {
  const { serviceManager, defaultKernel, kernelManager, lite } = useJupyter();
  const {
    path,
    kernel: propsKernel,
    readOnly,
    nbgrader,
    height,
    maxHeight,
    nbformat,
    Toolbar,
  } = props;

  const notebookStore = useNotebookStore();
  const [id] = useState(props.id || newUuid());
  const [adapter, setAdapter] = useState<NotebookAdapter>();
  const kernel = propsKernel || defaultKernel;
  const portals = notebookStore.selectNotebookPortals(id);
  const newAdapterState = () => {
    if (id && serviceManager && kernelManager && kernel) {
      kernel.ready.then(() => {
        const adapter = new NotebookAdapter(
          {
            ...props,
            kernel,
            id,
          },
          serviceManager,
          lite
        );
        setAdapter(adapter);
        notebookStore.update({ id, partialState: { adapter: adapter } })
        adapter.serviceManager.ready.then(() => {
          if (!readOnly) {
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
              notebookStore.modelChange({ id, notebookModel });
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
              notebookStore.kernelStatusChanged({ id, kernelStatus });
            }
          );
        });
      });
    }
  };
  useEffect(() => {
    if (adapter) {
      adapter.dispose();
    }
    newAdapterState();
    return () => {
      notebookStore.setPortalDisplay({ id, portalDisplay: undefined });
      notebookStore.dispose(id);
    };
  }, [id, serviceManager, kernelManager, kernel, path]);
  useEffect(() => {
    if (adapter && nbformat) {
      adapter.setNbformat(nbformat);
    }
  }, [nbformat]);
  return (
    <div
      style={{ height, width: '100%', position: 'relative' }}
      id="dla-Jupyter-Notebook"
    >
      {Toolbar && <Toolbar notebookId={props.id} />}
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
        <>{portals?.map((portal: React.ReactPortal) => portal)}</>
        <Box>{adapter && <Lumino id={path}>{adapter.panel}</Lumino>}</Box>
      </Box>
    </div>
  );
};

Notebook.defaultProps = {
  cellMetadataPanel: false,
  cellSidebarMargin: 120,
  height: '100vh',
  maxHeight: '100vh',
  nbgrader: false,
  readOnly: false,
  renderers: [],
} as Partial<INotebookProps>;

export default Notebook;
