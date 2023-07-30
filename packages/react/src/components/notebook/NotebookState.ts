import { ReactPortal } from "react";
import { useSelector } from "react-redux";
import actionCreatorFactory, { Action, Success } from "typescript-fsa";
import { combineEpics, Epic } from "redux-observable";
import { reducerWithInitialState } from "typescript-fsa-reducers";
import { ignoreElements, map, tap } from "rxjs/operators";
import { ofAction } from "@datalayer/typescript-fsa-redux-observable";
import * as nbformat from "@jupyterlab/nbformat";
import { INotebookModel } from "@jupyterlab/notebook";
import { NotebookChange } from "@jupyter/ydoc";
import { Cell, ICellModel } from "@jupyterlab/cells";
import { Kernel as JupyterKernel } from "@jupyterlab/services";
import Kernel from "./../../jupyter/services/kernel/Kernel";
import { IJupyterReactState } from "./../../redux/State";
import { cmdIds } from "./NotebookCommands";
import NotebookAdapter from "./NotebookAdapter";

type PortalDisplay = {
  portal: ReactPortal;
  pinned: boolean;
}

export type INotebookState = {
  model?: INotebookModel;
  adapter?: NotebookAdapter;
  saveRequest?: Date;
  activeCell?: Cell<ICellModel>;
  kernelStatus?: JupyterKernel.Status;
  notebookChange?: NotebookChange;
  portals: ReactPortal[];
  portalDisplay?: PortalDisplay;
}

/* State */

export interface INotebooksState {
  notebooks: Map<string, INotebookState>;
}

export const notebookInitialState: INotebooksState = {
  notebooks: new Map<string, INotebookState>(),
}

/* Selectors */

export const selectNotebook = (uid: string): INotebookState | undefined =>
  useSelector((state: IJupyterReactState) => {
    if (state.notebook) {
      return state.notebook.notebooks.get(uid);
    }
    return undefined;
  }
);

export const selectNotebookModel = (uid: string): {  model: INotebookModel | undefined, changed: any } | undefined =>
  useSelector((state: IJupyterReactState) => {
    if (state.notebook) {
      // We need a changed attribute to deal the React-Redux shallow equality.
      return {
        model: state.notebook.notebooks.get(uid)?.model,
        changed: state.notebook.notebooks.get(uid)?.model?.contentChanged,
      };
    }
    return undefined;
  },
);

export const selectKernelStatus = (uid: string): string | undefined =>
  useSelector((state: IJupyterReactState) => {
    if (state.notebook) {
      return state.notebook.notebooks.get(uid)?.kernelStatus;
    }
    return undefined;
  }
);

export const selectActiveCell = (uid: string): Cell<ICellModel> | undefined =>
  useSelector((state: IJupyterReactState) => {
    if (state.notebook) {
      return state.notebook.notebooks.get(uid)?.activeCell;
    }
    return undefined;
  }
);

export const selectNotebookPortals = (uid: string) =>
  useSelector((state: IJupyterReactState) => {
    if (state.notebook) {
      return state.notebook.notebooks.get(uid)?.portals;
    }
    return undefined;
  }
);

export const selectSaveRequest = (uid: string): Date | undefined =>
  useSelector((state: IJupyterReactState) => {
    if (state.notebook) {
      return state.notebook.notebooks.get(uid)?.saveRequest;
    }
    return undefined;
  }
);

export const selectNotebookPortalDisplay = (uid: string) =>
  useSelector((state: IJupyterReactState) => {
    if (state.notebook) {
      return state.notebook.notebooks.get(uid)?.portalDisplay;
    }
    return undefined;
  }
);

/* Actions */

export enum ActionType {
  ACTIVE_CELL_CHANGE = "notebook/ACTIVE_CELL_CHANGE",
  ADD_PORTALS = "notebook/ADD_PORTALS",
  CHANGE_CELL_TYPE = "notebook/CHANGE_CELL_TYPE",
  CHANGE_KERNEL = "notebook/CHANGE_KERNEL",
  DELETE = "notebook/DELETE",
  DISPOSE = "notebook/DISPOSE",
  INSERT_ABOVE = "notebook/INSERT_ABOVE",
  INSERT_BELOW = "notebook/INSERT_BELOW",
  INTERRUPT = "notebook/INTERRUPT",
  KERNEL_STATUS_CHANGE = "notebook/KERNEL_STATUS_CHANGE",
  MODEL_CHANGE = "notebook/MODEL_CHANGE",
  NOTEBOOK_CHANGE = "notebook/NOTEBOOK_CHANGE",
  RESET = "notebook/RESET",
  RUN = "notebook/RUN",
  RUN_ALL = "notebook/RUN_ALL",
  SAVE = "notebook/SAVE",
  SET_PORTALS = "notebook/SET_PORTALS",
  SET_PORTAL_DISPLAY = 'notebook/SET_PORTAL_DISPLAY',
  UPDATE = "notebook/UPDATE",
}

const actionCreator = actionCreatorFactory('jupyterNotebook');

type UpdateUid = {
  uid: string;
  partialState: Partial<INotebookState>;
}
type NotebookChangeUid = {
  uid: string;
  notebookChange: NotebookChange;
}
type NotebookModelUid = {
  uid: string;
  notebookModel: INotebookModel;
}
type CellModelUid = {
  uid: string;
  cellModel?: Cell<ICellModel>;
}
type KernelStatusUid = {
  uid: string;
  kernelStatus: JupyterKernel.Status;
}
type KernelChangeUid = {
  uid: string;
  kernel: Kernel;
}
type ReactPortalsUid = {
  uid: string;
  portals: ReactPortal[];
}
type PortalDisplayUid = {
  uid: string;
  portalDisplay: PortalDisplay | undefined;
}
type DateUid = {
  uid: string;
  date: Date | undefined;
}
type CellTypeUid = {
  uid: string;
  cellType: nbformat.CellType;
}

export const notebookActions = {
  reset: actionCreator<string>(
    ActionType.RESET
  ),
  update: actionCreator<UpdateUid>(
    ActionType.UPDATE
  ),
  notebookChange: actionCreator<NotebookChangeUid>(
    ActionType.NOTEBOOK_CHANGE
  ),
  modelChange: actionCreator<NotebookModelUid>(
    ActionType.MODEL_CHANGE
  ),
  changeKernel: actionCreator<KernelChangeUid>(
    ActionType.CHANGE_KERNEL
  ),
  activeCellChange: actionCreator<CellModelUid>(
    ActionType.ACTIVE_CELL_CHANGE
  ),
  kernelStatusChanged: actionCreator<KernelStatusUid>(
    ActionType.KERNEL_STATUS_CHANGE
  ),
  addPortals: actionCreator<ReactPortalsUid>(
    ActionType.ADD_PORTALS
  ),
  setPortals: actionCreator<ReactPortalsUid>(
    ActionType.SET_PORTALS
  ),
  setPortalDisplay: actionCreator<PortalDisplayUid>(
    ActionType.SET_PORTAL_DISPLAY
  ),
  dispose: actionCreator<string>(
    ActionType.DISPOSE
  ),
  save: actionCreator.async<DateUid, DateUid>(
    ActionType.SAVE
  ),
  run: actionCreator.async<string, string>(
    ActionType.RUN
  ),
  runAll: actionCreator.async<string, string>(
    ActionType.RUN_ALL
  ),
  interrupt: actionCreator.async<string, string>(
    ActionType.INTERRUPT
  ),
  insertAbove: actionCreator.async<CellTypeUid, CellTypeUid>(
    ActionType.INSERT_ABOVE
  ),
  insertBelow: actionCreator.async<CellTypeUid, CellTypeUid>(
    ActionType.INSERT_BELOW
  ),
  delete: actionCreator.async<string, string>(
    ActionType.DELETE
  ),
  changeCellType: actionCreator.async<CellTypeUid, CellTypeUid>(
    ActionType.CHANGE_CELL_TYPE
  )
}

/* Epics */

const runEpic: Epic<
  Action<Success<string, string>>,
  Action<Success<string, string>>,
  IJupyterReactState
> = (action$, state$) =>
    action$.pipe(
      ofAction(notebookActions.run.started),
      tap(action => {
        state$.value.notebook.notebooks.get(action.payload)?.adapter?.commands.execute(cmdIds.run);
      }),
      ignoreElements(),
    );

const runAllEpic: Epic<
  Action<Success<string, string>>,
  Action<Success<string, string>>,
  IJupyterReactState
> = (action$, state$) =>
    action$.pipe(
      ofAction(notebookActions.runAll.started),
      tap(action => {
        state$.value.notebook.notebooks.get(action.payload)?.adapter?.commands.execute(cmdIds.runAll);
      }),
      ignoreElements(),
    );

const interruptEpic: Epic<
  Action<Success<string, string>>,
  Action<Success<string, string>>,
  IJupyterReactState
> = (action$, state$) =>
    action$.pipe(
      ofAction(notebookActions.interrupt.started),
      tap(action => {
        state$.value.notebook.notebooks.get(action.payload)?.adapter?.commands.execute(cmdIds.interrupt);
      }),
      ignoreElements(),
    );

const insertAboveEpic: Epic<
  Action<Success<CellTypeUid, CellTypeUid>>,
  Action<Success<CellTypeUid, CellTypeUid>>,
  IJupyterReactState
> = (action$, state$) =>
    action$.pipe(
      ofAction(notebookActions.insertAbove.started),
      tap(action => {
        state$.value.notebook.notebooks.get(action.payload.uid)?.adapter?.setDefaultCellType(action.payload.cellType);
        state$.value.notebook.notebooks.get(action.payload.uid)?.adapter?.commands.execute(cmdIds.insertAbove);
      }),
      ignoreElements(),
    );

const insertBelowEpic: Epic<
  Action<Success<CellTypeUid, CellTypeUid>>,
  Action<Success<CellTypeUid, CellTypeUid>>,
  IJupyterReactState
> = (action$, state$) =>
    action$.pipe(
      ofAction(notebookActions.insertBelow.started),
      tap(action => {
        state$.value.notebook.notebooks.get(action.payload.uid)?.adapter?.setDefaultCellType(action.payload.cellType);
        state$.value.notebook.notebooks.get(action.payload.uid)?.adapter?.commands.execute(cmdIds.insertBelow);
      }),
      ignoreElements(),
    );

const deleteEpic: Epic<
  Action<Success<string, string>>,
  Action<Success<string, string>>,
  IJupyterReactState
> = (action$, state$) =>
    action$.pipe(
      ofAction(notebookActions.delete.started),
      tap(action => {
        state$.value.notebook.notebooks.get(action.payload)?.adapter?.commands.execute(cmdIds.deleteCells);
      }),
      ignoreElements(),
    );

const changeCellTypeEpic: Epic<
  Action<Success<CellTypeUid, CellTypeUid>>,
  Action<Success<CellTypeUid, CellTypeUid>>,
  IJupyterReactState
> = (action$, state$) =>
    action$.pipe(
      ofAction(notebookActions.changeCellType.started),
      tap(action => {
        //      state$.value.notebook?.adapter?.commands.execute(cmdIds.toCode);
        state$.value.notebook.notebooks.get(action.payload.uid)?.adapter?.changeCellType(action.payload.cellType);
        /*
        NotebookActions.changeCellType(
          state$.value.notebook.notebooks.get(action.payload)?.adapter?.notebookPanel?.content!,
          action.payload
        );
        */
      }),
      ignoreElements(),
    );

const saveEpic: Epic<
  Action<Success<DateUid, DateUid>>,
  Action<Success<DateUid, DateUid>>,
  IJupyterReactState
> = (action$, state$) =>
    action$.pipe(
      ofAction(notebookActions.save.started),
      map(action => {
        state$.value.notebook.notebooks.get(action.payload.uid)?.adapter?.commands.execute(cmdIds.save);
        return notebookActions.save.done({
          params: action.payload,
          result: action.payload,
        });
      })
    );

export const notebookEpics = combineEpics(
  runEpic,
  runAllEpic,
  interruptEpic,
  insertAboveEpic,
  insertBelowEpic,
  deleteEpic,
  changeCellTypeEpic,
  saveEpic,
);

/* Reducers */

export const notebookReducer = reducerWithInitialState(notebookInitialState)
  .case(notebookActions.reset, (state: INotebooksState, _: string) => {
    return notebookInitialState;
  })
  .case(notebookActions.update, (state: INotebooksState, updateUid: UpdateUid) => {
    const notebooks = state.notebooks;
    let notebook = notebooks.get(updateUid.uid);
    if (notebook) {
      notebook = { ...notebook, ...updateUid.partialState }
    } else {
      notebooks.set(updateUid.uid, {
        adapter: updateUid.partialState.adapter,
        portals: [],
      })
    }
    return {
      ...state,
      notebooks,
    }
  })
  .case(notebookActions.activeCellChange, (state: INotebooksState, cellModelUid: CellModelUid) => {
    const notebooks = state.notebooks;
    const notebook = notebooks.get(cellModelUid.uid);
    if (notebook) {
      notebook.activeCell = cellModelUid.cellModel;
    }
    return {
      ...state,
      notebooks,
    }
  })
  .case(notebookActions.modelChange, (state: INotebooksState, notebookModelUid: NotebookModelUid) => {
    const notebooks = state.notebooks;
    const notebook = notebooks.get(notebookModelUid.uid);
    if (notebook) {
      notebook.model = notebookModelUid.notebookModel;
    }
    return {
      ...state,
      notebooks,
    }
  })
  .case(notebookActions.notebookChange, (state: INotebooksState, notebookChangeUid: NotebookChangeUid) => {
    const notebooks = state.notebooks;
    const notebook = notebooks.get(notebookChangeUid.uid);
    if (notebook) {
      notebook.notebookChange = notebookChangeUid.notebookChange;
    }
    return {
      ...state,
      notebooks,
    }
  })
  .case(notebookActions.kernelStatusChanged, (state: INotebooksState, kernelStatusUid: KernelStatusUid) => {
    const notebooks = state.notebooks;
    const notebook = notebooks.get(kernelStatusUid.uid);
    if (notebook) {
      notebook.kernelStatus = kernelStatusUid.kernelStatus;
    }
    return {
      ...state,
      notebooks,
    }
  })
  .case(notebookActions.changeKernel, (state: INotebooksState, kernelChange: KernelChangeUid) => {
    const notebooks = state.notebooks;
    const notebook = notebooks.get(kernelChange.uid);
    if (notebook) {
      notebook.adapter?.changeKernel(kernelChange.kernel);
    }
    return {
      ...state,
      notebooks,
    }
  })
  .case(notebookActions.addPortals, (state: INotebooksState, portalsUid: ReactPortalsUid) => {
    const notebooks = state.notebooks;
    const notebook = notebooks.get(portalsUid.uid);
    if (notebook) {
      notebook.portals = notebook.portals.concat(portalsUid.portals);
    }
    return {
      ...state,
      notebooks,
    }
  })
  .case(notebookActions.dispose, (state: INotebooksState, uid: string) => {
    const notebooks = state.notebooks;
    notebooks.delete(uid);
    return {
      ...state,
      notebooks,
    }
  })
  .case(notebookActions.setPortals, (state: INotebooksState, portalsUid: ReactPortalsUid) => {
    const notebooks = state.notebooks;
    const notebook = notebooks.get(portalsUid.uid);
    if (notebook) {
      notebook.portals = portalsUid.portals;
    }
    return {
      ...state,
      notebooks,
    }
  })
  .case(notebookActions.setPortalDisplay, (state: INotebooksState, portalDisplayUid: PortalDisplayUid) => {
    const notebooks = state.notebooks;
    const notebook = notebooks.get(portalDisplayUid.uid);
    if (notebook) {
      notebook.portalDisplay = portalDisplayUid.portalDisplay;
    }
    return {
      ...state,
      notebooks,
    }
  })
  .case(notebookActions.save.done, (state: INotebooksState, dateUid: Success<DateUid, DateUid>) => {
    const notebooks = state.notebooks;
    const notebook = notebooks.get(dateUid.result.uid);
    if (notebook) {
      notebook.saveRequest = dateUid.result.date;
    }
    return {
      ...state,
      notebooks,
    }
  })
  .case(notebookActions.insertAbove.done, (state: INotebooksState, _: Success<CellTypeUid, CellTypeUid>) => {
    return state;
  })
  .case(notebookActions.insertBelow.done, (state: INotebooksState, _: Success<CellTypeUid, CellTypeUid>) => {
    return state;
  })
  .case(notebookActions.changeCellType.done, (state: INotebooksState, _: Success<CellTypeUid, CellTypeUid>) => {
    return state;
  })
  .case(notebookActions.run.done, (state: INotebooksState, _: Success<string, string>) => {
    return state
  })
  .case(notebookActions.delete.done, (state: INotebooksState, _: Success<string, string>) => {
    return state
  }
);
