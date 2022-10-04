import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import { Box } from "@primer/react";
import { Cell, ICellModel } from '@jupyterlab/cells';
import * as nbformat from '@jupyterlab/nbformat';
import { useJupyter } from "./../../jupyter/JupyterContext";
import { Kernel } from "./../../jupyter/services/kernel/Kernel";
import Lumino from '../../jupyter/lumino/LuminoNotebook';
import { asObservable } from './../../jupyter/lumino/LuminoObservable';
import CellMetadataEditor from './cell/metadata/CellMetadataEditor';
import NotebookAdapter from './NotebookAdapter';
import { notebookActions, selectNotebookPortals, notebookEpics, notebookReducer } from './NotebookState';

import './Notebook.css';

export type INotebookProps = {
  uid: string
  path: string;
  model: nbformat.INotebookContent;
  readOnly: boolean;
  nbgrader: boolean;
  ipywidgets: 'classic' | 'lab';
  kernel?: Kernel;
  cellMetadataPanel: boolean;
  CellSidebar?: (props: any) => JSX.Element;
  cellSidebarMargin: number;
  height?: string;
}

const LuminoNotebook = (props: { adapter: NotebookAdapter }) => {
  const { adapter } = props;
  return <Lumino adapter={adapter} />
}

/**
 * This component creates a Notebook as a collection of snippets 
 * with sidebars.
 * 
 * @param props The notebook properties.
 * @returns A Notebook React.js component.
 */
export const Notebook = (props: INotebookProps) => {
  const { serviceManager, kernel, kernelManager, injectableStore } = useJupyter();
  const { readOnly, cellMetadataPanel, nbgrader, uid, model, height } = props;
  const dispatch = useDispatch();
  const portals = selectNotebookPortals();
  const [adapter, setAdapter] = useState<NotebookAdapter>();
  useMemo(() => {
    (injectableStore as any).inject('notebook', notebookReducer, notebookEpics);
  }, []);
  useEffect(() => {
    if (serviceManager && kernelManager && kernel) {
      //  const kernel = readOnly ? undefined : new Kernel({ kernelManager });
      const adapter = new NotebookAdapter(
        { ...props, kernel },
        injectableStore,
        serviceManager,
      );
      setAdapter(adapter);
      dispatch(notebookActions.update({ adapter }));
      adapter.serviceManager.ready.then(() => {
        adapter.loadNotebook();
        if (!readOnly && cellMetadataPanel) {
          const activeCellChanged$ = asObservable(adapter.notebookPanel!.content.activeCellChanged);
          activeCellChanged$.subscribe(
            (activeCellChanged: Cell<ICellModel>) => {
              dispatch(notebookActions.activeCellChange(activeCellChanged));
              const panelDiv = document.getElementById('right-panel-id') as HTMLDivElement;
              if (panelDiv) {
                const cellMetadataOptions = (
                  <Box mt={3}>
                    <CellMetadataEditor cell={activeCellChanged} nbgrader={nbgrader} />
                  </Box>
                );
                const portal = createPortal(cellMetadataOptions, panelDiv);
                dispatch(notebookActions.setPortal({ portal, pinned: false }));
              }
            }
          );
        }
        adapter.notebookPanel?.model?.contentChanged.connect((notebookModel, _) => {
          dispatch(notebookActions.modelChange(notebookModel));
        });
        adapter.notebookPanel?.content.activeCellChanged.connect((_, activeCellChanged) => {
          dispatch(notebookActions.activeCellChange(activeCellChanged));
        });
        adapter.notebookPanel?.model!.sharedModel.changed.connect((_, notebookChange) => {
          dispatch(notebookActions.notebookChange(notebookChange));
        });
        adapter.notebookPanel?.sessionContext.statusChanged.connect((_, kernelStatusChanged) => {
          dispatch(notebookActions.kernelStatusChanged(kernelStatusChanged));
        });
      });
      return () => {
        setAdapter(undefined);
        dispatch(notebookActions.setPortal(undefined));
      }
    }
  }, [uid, serviceManager, kernelManager, kernel, model]);
  return (
    <div id="dla-Jupyter-Notebook">
      <Box
        css={{
          '& .dla-Jupyter-Notebook': {
            width: '100%',
            height,
            overflowY: 'hidden',
          },
          '& .jp-Notebook': {
            flex: '1 1 auto !important',
          },
          '& .jp-NotebookPanel': {
            width: "100% !important",
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
        }}
      >
        <>
          {portals.map((portal: React.ReactPortal) => portal)}
        </>
        <Box>
          {adapter &&
            <LuminoNotebook adapter={adapter} />
          }
        </Box>
      </Box>
    </div>
  )
}

Notebook.defaultProps = {
  ipywidgets: 'lab',
  readOnly: false,
  nbgrader: false,
  cellMetadataPanel: false,
  cellSidebarMargin: 120,
  height: '100vh',
} as Partial<INotebookProps>;

export default Notebook;
