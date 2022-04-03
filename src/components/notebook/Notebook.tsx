import { useEffect, useMemo } from "react";
import { useDispatch, useStore } from "react-redux";
import NotebookAdapter from './NotebookAdapter';
import { notebookEpics, notebookActions, notebookReducer, selectNotebook } from './NotebookState';
import LuminoAttached from '../../lumino/LuminoAttached';
import { asObservable } from '../../lumino/LuminoObservable'

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
      (injectableStore as any).injectEpic(notebookEpics(notebookAdapter));
    }
    notebookAdapter.manager.ready.then(() => {
      notebookAdapter.createApp(props.path);
      const activeCellChanged$ = asObservable(notebookAdapter.notebookPanel.content.activeCellChanged);
      activeCellChanged$.subscribe(
        activeCellChanged => {
          dispatch(notebookActions.activeCellChange.started(activeCellChanged));
        }
      );
      const notebookChange$ = asObservable(notebookAdapter.notebookPanel.model!.sharedModel.changed);
      notebookChange$.subscribe(
        notebookChange => {
          dispatch(notebookActions.notebookChange.started(notebookChange));
        }
      );
      const kernelStatusChanged$ = asObservable(notebookAdapter.notebookPanel.sessionContext.statusChanged);
      kernelStatusChanged$.subscribe(
        kernelStatusChanged => {
          dispatch(notebookActions.kernelStatusChanged.started(kernelStatusChanged));
        }
      );
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
