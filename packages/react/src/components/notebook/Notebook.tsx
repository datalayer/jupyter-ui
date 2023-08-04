import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import { Box } from "@primer/react";
import { Cell, ICellModel } from '@jupyterlab/cells';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { INotebookContent } from '@jupyterlab/nbformat';
import { useJupyter } from "./../../jupyter/JupyterContext";
import { Kernel } from "./../../jupyter/services/kernel/Kernel";
import { newUuid } from './../../jupyter/utils/Ids';
import LuminoNotebook from '../../jupyter/lumino/LuminoNotebook';
import { asObservable } from './../../jupyter/lumino/LuminoObservable';
import CellMetadataEditor from './cell/metadata/CellMetadataEditor';
import { CellSidebarProps } from './cell/sidebar/lumino/CellSidebarWidget'
import NotebookAdapter from './NotebookAdapter';
import { notebookActions, selectNotebookPortals, notebookEpics, notebookReducer } from './NotebookState';

import './Notebook.css';

export type INotebookProps = {
  uid: string
  path: string;
  nbformat: INotebookContent;
  kernel?: Kernel;
  readOnly: boolean;
  nbgrader: boolean;
  ipywidgets: 'classic' | 'lab';
  cellMetadataPanel: boolean;
  CellSidebar?: (props: CellSidebarProps) => JSX.Element;
  cellSidebarMargin: number;
  Toolbar?: (props: any) => JSX.Element;
  height?: string;
  maxHeight?: string;
  renderers: IRenderMime.IRendererFactory[];
}

/**
 * This component creates a Notebook as a collection of snippets 
 * with sidebars.
 * 
 * @param props The notebook properties.
 * @returns A Notebook React.js component.
 */
export const Notebook = (props: INotebookProps) => {
  const { serviceManager, defaultKernel, kernelManager, injectableStore } = useJupyter();
  const { kernel, readOnly, nbgrader, uid: propsUid, height, maxHeight } = props;
  const [uid] = useState(propsUid || newUuid());
  const effectiveKernel = kernel || defaultKernel;
  const dispatch = useDispatch();
  const portals = selectNotebookPortals(uid);
  const [adapter, setAdapter] = useState<NotebookAdapter>();
  useEffect(() => {
    injectableStore.inject('notebook', notebookReducer, notebookEpics);
  }, []);
  useEffect(() => {
    if (uid && serviceManager && kernelManager && effectiveKernel) {
      const adapter = new NotebookAdapter(
        {
          ...props,
          kernel: effectiveKernel,
          uid,
        },
        injectableStore,
        serviceManager,
      );
      setAdapter(adapter);
      dispatch(notebookActions.update({ uid, partialState: { adapter } }));
      adapter.serviceManager.ready.then(() => {
        if (!readOnly) {
          const activeCell = adapter.notebookPanel!.content.activeCell
          if (activeCell) {
            dispatch(notebookActions.activeCellChange({ uid, cellModel: activeCell }));
          }
          const activeCellChanged$ = asObservable(adapter.notebookPanel!.content.activeCellChanged);
          activeCellChanged$.subscribe(
            (cellModel: Cell<ICellModel>) => {
              dispatch(notebookActions.activeCellChange({ uid, cellModel }));
              const panelDiv = document.getElementById('right-panel-id') as HTMLDivElement;
              if (panelDiv) {
                const cellMetadataOptions = (
                  <Box mt={3}>
                    <CellMetadataEditor notebookId={uid} cell={cellModel} nbgrader={nbgrader} />
                  </Box>
                );
                const portal = createPortal(cellMetadataOptions, panelDiv);
                dispatch(notebookActions.setPortalDisplay({ uid, portalDisplay: { portal, pinned: false } }));
              }
            }
          );
        }
        adapter.notebookPanel?.model?.contentChanged.connect((notebookModel, _) => {
          dispatch(notebookActions.modelChange({ uid, notebookModel }));
        });
        /*
        adapter.notebookPanel?.model!.sharedModel.changed.connect((_, notebookChange) => {
          dispatch(notebookActions.notebookChange({ uid, notebookChange }));
        });
        adapter.notebookPanel?.content.modelChanged.connect((notebook, _) => {
          dispatÅch(notebookActions.notebookChange({ uid, notebook }));
        });
        */
        adapter.notebookPanel?.content.activeCellChanged.connect((_, cellModel) => {
          if (cellModel === null) {
            dispatch(notebookActions.activeCellChange({ uid, cellModel: undefined }));
          } else {
            dispatch(notebookActions.activeCellChange({ uid, cellModel }));
          }
        });
        adapter.notebookPanel?.sessionContext.statusChanged.connect((_, kernelStatus) => {
          dispatch(notebookActions.kernelStatusChanged({ uid, kernelStatus }));
        });
      });
      return () => {
        adapter.dispose();
        setAdapter(undefined);
        dispatch(notebookActions.setPortalDisplay({ uid, portalDisplay: undefined }));
        dispatch(notebookActions.dispose(uid));
      }
    }
  }, [uid, serviceManager, kernelManager, effectiveKernel]);
  return (
    <div style={{ height, width: '100%', position: "relative" }} id="dla-Jupyter-Notebook">
      {
        props.Toolbar && <props.Toolbar notebookId={props.uid} />
      }
      <Box className="box-notebook"
        sx={{
          '& .dla-Jupyter-Notebook': {
            height,
            maxHeight,
            width: '100%',
            overflowY: 'hidden',
          },
          '& .jp-Notebook': {
            flex: '1 1 auto !important',
            height: '100%',
            overflowY: 'scroll',
          },
          '& .jp-NotebookPanel': {
            height: '100% !important',
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
          '.box-notebook': {
            position: 'relative',
          },
        }}
      >
        <>
          {portals?.map((portal: React.ReactPortal) => portal)}
        </>
        <Box>
          { adapter &&
            <LuminoNotebook adapter={adapter} />
          }
        </Box>
      </Box >
    </div>
  )
}

Notebook.defaultProps = {
  ipywidgets: 'classic',
  readOnly: false,
  nbgrader: false,
  cellMetadataPanel: false,
  cellSidebarMargin: 120,
  height: '100vh',
  maxHeight: '100vh',
  renderers: [],
} as Partial<INotebookProps>;

export default Notebook;
