import { useEffect, useMemo } from "react";
import { useDispatch, useStore } from "react-redux";
import { Cell, ICellModel } from "@jupyterlab/cells";
import { NotebookChange } from "@jupyterlab/shared-models";
import { Kernel } from '@jupyterlab/services';
import NotebookAdapter from './NotebookAdapter';
import { notebookActions, notebookReducer, selectNotebook } from './NotebookState';
import LuminoAttached from '../../lumino/LuminoAttached';

export type INotebookProps = {
  path: string;
  ipywidgets?: 'classic' | 'lab';
  sidebarMargin: number;
  sidebarComponent?: (props: any) => JSX.Element;
}

/**
 * This components creates a Notebook as a collection of cells 
 * with sidebars.
 * 
 * @param props The notebook properties.
 * @returns A Notebook React.js component.
 */
export const Notebook = (props: INotebookProps) => {
  const injectableStore = useStore();
  const dispatch = useDispatch();
  const notebook = selectNotebook();
  const portals = notebook.portals;
  const notebookAdapter = useMemo(() => new NotebookAdapter(props, injectableStore), []);
  useEffect(() => {
    if (!(injectableStore as any).asyncReducers!.notebook) {
      (injectableStore as any).injectReducer('notebook', notebookReducer);
    }
    notebookAdapter.manager.ready.then(() => {
      notebookAdapter.loadNotebook(props.path);
      notebookAdapter.notebookPanel.content.activeCellChanged.connect((_, activeCellChanged: Cell<ICellModel>) => {
        dispatch(notebookActions.activeCellChange(activeCellChanged));
      });
      notebookAdapter.notebookPanel.model!.sharedModel.changed.connect((_, notebookChange: NotebookChange) => {
        dispatch(notebookActions.notebookChange(notebookChange));
      });
      notebookAdapter.notebookPanel.sessionContext.statusChanged.connect((_, kernelStatusChanged: Kernel.Status) => {
        dispatch(notebookActions.kernelStatusChanged(kernelStatusChanged));
      });
    });
  }, []);
  return (
    <div
      css={{
        '& .jp-Toolbar': {
          display: 'none',
        },
        '& .jp-Cell': {
          width: `calc(100% - ${props.sidebarMargin}px)`,
        },
        '& .jp-Cell .jp-CellHeader': {
          height: 'auto',
          position: 'absolute',
          top: '-5px',
          left: `${props.sidebarMargin + 10}px`,
        },
        '& .jp-Cell .dla-cellHeaderContainer': {
          padding: '4px 8px',
          width: `${props.sidebarMargin + 10}px`,
          cursor: 'pointer',
          userSelect: 'none',
          marginLeft: 'auto',
          zIndex: 100,
        },
      }}
    >
      <>{portals.map((portal: React.ReactPortal) => portal)}</>
      <LuminoAttached>{notebookAdapter.panel}</LuminoAttached>
    </div>
  )
}

Notebook.defaultProps = {
  ipywidgets: 'lab',
  sidebarMargin: 100,
} as Partial<INotebookProps>;

export default Notebook;
