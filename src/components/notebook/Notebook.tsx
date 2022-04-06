import { useEffect, useMemo } from "react";
import { useDispatch, useStore } from "react-redux";
import { NotebookChange } from "@jupyterlab/shared-models";
import { Kernel } from '@jupyterlab/services';
import { Cell, ICellModel } from '@jupyterlab/cells';
import { useJupyter } from '../../jupyter/JupyterContext';
import NotebookAdapter from './NotebookAdapter';
import { notebookActions, selectNotebook } from './NotebookState';
import JupyterKernel from './../../kernel/Kernel';
import LuminoAttached from '../../lumino/LuminoAttached';
import { asObservable } from '../../lumino/LuminoObservable'

import '@jupyterlab/completer/style/index.css';
import '@jupyterlab/documentsearch/style/index.css';
import '@jupyterlab/notebook/style/index.css';
import '@jupyterlab/theme-light-extension/style/theme.css';
import '@jupyterlab/theme-light-extension/style/variables.css';

import './Notebook.css';

export type INotebookProps = {
  path: string;
  ipywidgets?: 'classic' | 'lab';
  sidebarMargin: number;
  sidebarComponent?: (props: any) => JSX.Element;
}

/**
 * This component creates a Notebook as a collection 
 * of cells with sidebars.
 * 
 * @param props The notebook properties.
 * @returns A Notebook component.
 */
export const Notebook = (props: INotebookProps) => {
  const store = useStore();
  const dispatch = useDispatch();
  const { baseUrl, wsUrl } = useJupyter();
  const notebook = selectNotebook();
  const portals = notebook.portals;
  const kernel = useMemo(() => new JupyterKernel({
    baseUrl,
    wsUrl,
  }), []);
  const adapter = useMemo(() => new NotebookAdapter(props, store, kernel), []);
  useEffect(() => {
    dispatch(notebookActions.update({ adapter }));
    adapter.manager.ready.then(() => {
      adapter.loadNotebook(props.path);
      const activeCellChanged$ = asObservable(adapter.notebookPanel.content.activeCellChanged);
      activeCellChanged$.subscribe(
        (activeCellChanged: Cell<ICellModel>) => {
          dispatch(notebookActions.activeCellChange(activeCellChanged));
        }
      );
      adapter.notebookPanel.model!.sharedModel.changed.connect((_, notebookChange: NotebookChange) => {
        dispatch(notebookActions.notebookChange(notebookChange));
      });
      adapter.notebookPanel.sessionContext.statusChanged.connect((_, kernelStatusChanged: Kernel.Status) => {
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
        '& .jp-Cell .dla-CellHeader-container': {
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
      <LuminoAttached>{adapter.panel}</LuminoAttached>
    </div>
  )
}

Notebook.defaultProps = {
  ipywidgets: 'lab',
  sidebarMargin: 100,
} as Partial<INotebookProps>;

export default Notebook;
