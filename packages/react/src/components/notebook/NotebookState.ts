import { ReactPortal } from "react";
import { useSelector } from "react-redux";
import actionCreatorFactory, { AnyAction, Action, Success } from "typescript-fsa";
import { combineEpics, Epic } from "redux-observable";
import { reducerWithInitialState } from "typescript-fsa-reducers";
import { ignoreElements, map, tap } from "rxjs/operators";
import { ofAction } from "@datalayer/typescript-fsa-redux-observable";
import * as nbformat from "@jupyterlab/nbformat";
import { INotebookModel, NotebookActions } from "@jupyterlab/notebook";
import { NotebookChange } from "@jupyterlab/shared-models";
import { Cell, ICellModel } from "@jupyterlab/cells";
import { Kernel } from "@jupyterlab/services";
import { cmdIds } from "./NotebookCommands";
import NotebookAdapter from "./NotebookAdapter";
import { IJupyterReactState } from "./../../state/State";

type PortalDisplay = {
  portal: ReactPortal;
  pinned: boolean;
}

/* State */

export interface INotebookState {
  model?: INotebookModel;
  activeCell?: Cell<ICellModel>;
  kernelStatus?: Kernel.Status;
  notebookChange?: NotebookChange;
  portals: ReactPortal[];
  adapter?: NotebookAdapter;
  saveRequest?: Date;
  portal?: PortalDisplay;
}

export const notebookInitialState: INotebookState = {
  model: undefined,
  activeCell: undefined,
  kernelStatus: undefined,
  notebookChange: undefined,
  portals: [],
  adapter: undefined,
  saveRequest: undefined,
}

/* Selectors */

export const selectNotebook = (): INotebookState =>
  useSelector((state: IJupyterReactState) => {
    if (state.notebook) {
      return state.notebook;
    }
    return notebookInitialState;
  }
);

export const selectNotebookModel = (): INotebookModel | undefined =>
  useSelector((state: IJupyterReactState) => {
    if (state.notebook) {
      return state.notebook.model;
    }
    return notebookInitialState.model;
  }
);

export const selectActiveCell = (): Cell<ICellModel> | undefined =>
  useSelector((state: IJupyterReactState) => {
    if (state.notebook) {
      return state.notebook.activeCell;
    }
    return notebookInitialState.activeCell;
  }
);

export const selectNotebookPortals = () =>
  useSelector((state: IJupyterReactState) => {
    if (state.notebook) {
      return state.notebook.portals;
    }
    return notebookInitialState.portals;
  }
);

export const selectSaveRequest = (): Date | undefined =>
  useSelector((state: IJupyterReactState) => {
    if (state.notebook) {
      return state.notebook.saveRequest;
    }
    return notebookInitialState.saveRequest;
  }
);

export const selectNotebookPortal = () =>
  useSelector((state: IJupyterReactState) => {
    if (state.notebook) {
      return state.notebook.portal;
    }
    return notebookInitialState.portal;
  }
);

/* Actions */

export enum ActionType {
  RESET = "notebook/RESET",
  UPDATE = "notebook/UPDATE",
  NOTEBOOK_CHANGE = "notebook/NOTEBOOK_CHANGE",
  MODEL_CHANGE = "notebook/MODEL_CHANGE",
  ACTIVE_CELL_CHANGE = "notebook/ACTIVE_CELL_CHANGE",
  KERNEL_STATUS_CHANGE = "notebook/KERNEL_STATUS_CHANGE",
  RUN = "notebook/RUN",
  RUN_ALL = "notebook/RUN_ALL",
  SAVE = "notebook/SAVE",
  INTERRUPT = "notebook/INTERRUPT",
  INSERT_ABOVE = "notebook/INSERT_ABOVE",
  INSERT_BELOW = "notebook/INSERT_BELOW",
  DELETE = "notebook/DELETE",
  PORTAL = "notebook/PORTAL",
  SET_PORTALS = "notebook/SET_PORTALS",
  CHANGE_CELL_TYPE = "notebook/CHANGE_CELL_TYPE",
  SET_PORTAL = 'notebook/SET_PORTAL',
}

const actionCreator = actionCreatorFactory('jupyterNotebook');

export const notebookActions = {
  reset: actionCreator<void>(
    ActionType.RESET
  ),
  update: actionCreator<Partial<INotebookState>>(
    ActionType.UPDATE
  ),
  notebookChange: actionCreator<NotebookChange>(
    ActionType.NOTEBOOK_CHANGE
  ),
  modelChange: actionCreator<INotebookModel>(
    ActionType.MODEL_CHANGE
  ),
  activeCellChange: actionCreator<Cell<ICellModel>>(
    ActionType.ACTIVE_CELL_CHANGE
  ),
  kernelStatusChanged: actionCreator<Kernel.Status>(
    ActionType.KERNEL_STATUS_CHANGE
  ),
  portal: actionCreator<ReactPortal[]>(
    ActionType.PORTAL
  ),
  setPortals: actionCreator<ReactPortal[]>(
    ActionType.SET_PORTALS
  ),
  setPortal: actionCreator<PortalDisplay | undefined>(
    ActionType.SET_PORTAL
  ),
  save: actionCreator.async<Date | undefined, Date | undefined>(
    ActionType.SAVE
  ),
  run: actionCreator.async<void, void>(
    ActionType.RUN
  ),
  runAll: actionCreator.async<void, void>(
    ActionType.RUN_ALL
  ),
  interrupt: actionCreator.async<void, void>(
    ActionType.INTERRUPT
  ),
  insertAbove: actionCreator.async<nbformat.CellType, nbformat.CellType>(
    ActionType.INSERT_ABOVE
  ),
  insertBelow: actionCreator.async<nbformat.CellType, nbformat.CellType>(
    ActionType.INSERT_BELOW
  ),
  delete: actionCreator.async<void, void>(
    ActionType.DELETE
  ),
  changeCellType: actionCreator.async<nbformat.CellType, nbformat.CellType>(
    ActionType.CHANGE_CELL_TYPE
  )
}

/* Epics */

const runEpic: Epic<
  AnyAction,
  Action<Success<void, void>>,
  IJupyterReactState
> = (action$, state$) =>
  action$.pipe(
    ofAction(notebookActions.run.started),
    tap(action => {
      state$.value.notebook?.adapter?.commands.execute(cmdIds.run);
    }),
    ignoreElements(),
  );

const runAllEpic: Epic<
  AnyAction,
  Action<Success<void, void>>,
  IJupyterReactState
> = (action$, state$) =>
  action$.pipe(
    ofAction(notebookActions.runAll.started),
    tap(action => {
      state$.value.notebook?.adapter?.commands.execute(cmdIds.runAll);
    }),
    ignoreElements(),
  );

const interruptEpic: Epic<
  AnyAction,
  Action<Success<nbformat.CellType, nbformat.CellType>>,
  IJupyterReactState
> = (action$, state$) =>
  action$.pipe(
    ofAction(notebookActions.interrupt.started),
    tap(action => {
      state$.value.notebook?.adapter?.commands.execute(cmdIds.interrupt);
    }),
    ignoreElements(),
  );

const insertAboveEpic: Epic<
  AnyAction,
  Action<Success<nbformat.CellType, nbformat.CellType>>,
  IJupyterReactState
> = (action$, state$) =>
  action$.pipe(
    ofAction(notebookActions.insertAbove.started),
    tap(action => {
      (state$.value.notebook! as INotebookState).adapter!.setDefaultCellType(action.payload);
      state$.value.notebook!.adapter!.commands.execute(cmdIds.insertAbove);
    }),
    ignoreElements(),
  );

const insertBelowEpic: Epic<
  AnyAction,
  Action<Success<void, void>>,
  IJupyterReactState
> = (action$, state$) =>
  action$.pipe(
    ofAction(notebookActions.insertBelow.started),
    tap(action => {
      (state$.value.notebook! as INotebookState).adapter!.setDefaultCellType(action.payload);
      state$.value.notebook?.adapter?.commands.execute(cmdIds.insertBelow);
    }),
    ignoreElements(),
  );

const deleteEpic: Epic<
  AnyAction,
  Action<Success<void, void>>,
  IJupyterReactState
> = (action$, state$) =>
  action$.pipe(
    ofAction(notebookActions.delete.started),
    tap(action => {
      state$.value.notebook?.adapter?.commands.execute(cmdIds.deleteCells);
    }),
    ignoreElements(),
  );

const changeCellTypeEpic: Epic<
  AnyAction,
  Action<Success<nbformat.CellType, nbformat.CellType>>,
  IJupyterReactState
> = (action$, state$) =>
  action$.pipe(
    ofAction(notebookActions.changeCellType.started),
    tap(action => {
//      state$.value.notebook?.adapter?.changeCellType(action.payload);
//      state$.value.notebook?.adapter?.commands.execute(cmdIds.toCode);
      NotebookActions.changeCellType(
        state$.value.notebook?.adapter?.notebookPanel?.content!,
        action.payload
      );
    }),
    ignoreElements(),
  );

const saveEpic: Epic<
  AnyAction,
  Action<Success<Date | undefined, Date | undefined>>,
  IJupyterReactState
> = (action$, state$) =>
  action$.pipe(
    ofAction(notebookActions.save.started),
    map(action => {
      state$.value.notebook?.adapter?.commands.execute(cmdIds.save);
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
  .case(notebookActions.reset, (state: INotebookState, _: void) => {
    return notebookInitialState;
  })
  .case(notebookActions.update, (state: INotebookState, partialState: Partial<INotebookState>) => {
    return {
      ...state,
      ...partialState,
    }
  })
  .case(notebookActions.activeCellChange, (state: INotebookState, activeCell: Cell<ICellModel>) => {
    return {
      ...state,
      activeCell,
    }
  })
  .case(notebookActions.modelChange, (state: INotebookState, model: INotebookModel) => {
    return {
      ...state,
      model,
    }
  })
  .case(notebookActions.notebookChange, (state: INotebookState, notebookChange: NotebookChange) => {
    return {
      ...state,
      notebookChange,
    }
  })
  .case(notebookActions.kernelStatusChanged, (state: INotebookState, kernelStatus: Kernel.Status) => {
    return {
      ...state,
      kernelStatus,
    }
  })
  .case(notebookActions.portal, (state: INotebookState, portal: ReactPortal[]) => {
    const portals = state.portals.concat(portal);
    return {
      ...state,
      portals,
    }
  })
  .case(notebookActions.setPortals, (state: INotebookState, portals: ReactPortal[]) => {
    return {
      ...state,
      portals,
    }
  })
  .case(notebookActions.setPortal, (state: INotebookState, portal: PortalDisplay) => {
    return {
      ...state,
      portal,
    }
  })
  .case(notebookActions.save.done, (state: INotebookState, payload: Success<Date | undefined, Date | undefined>) => {
    return {
      ...state,
      saveRequest: payload.result,
    }
  })
  .case(notebookActions.insertAbove.done, (state: INotebookState, payload: Success<nbformat.CellType, nbformat.CellType>) => {
      return state;
  })
  .case(notebookActions.insertBelow.done, (state: INotebookState, payload: Success<nbformat.CellType, nbformat.CellType>) => {
      return state;
  })
  .case(notebookActions.changeCellType.done, (state: INotebookState, payload: Success<nbformat.CellType, nbformat.CellType>) => {
    return state;
  })
  .case(notebookActions.run.done, (state: INotebookState, _: Success<void, void>) => {
    return state
  }
);
