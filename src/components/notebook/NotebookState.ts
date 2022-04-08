import { useSelector } from "react-redux";
import actionCreatorFactory, { AnyAction, Action, Success } from "typescript-fsa";
import { combineEpics, Epic } from "redux-observable";
import { ignoreElements, tap } from "rxjs/operators";
import { ofAction } from "@datalayer/typescript-fsa-redux-observable";
import { reducerWithInitialState } from "typescript-fsa-reducers";
import { NotebookChange } from "@jupyterlab/shared-models";
import { Cell, ICellModel } from "@jupyterlab/cells";
import { Kernel } from "@jupyterlab/services";
import { cmdIds } from "./NotebookCommands";
import { IState } from "./../../state/State";
import NotebookAdapter from "./NotebookAdapter";

/* State */

export interface INotebookState {
  activeCell: Cell<ICellModel> | undefined;
  kernelStatus: Kernel.Status | undefined;
  notebookChange: NotebookChange | undefined;
  portals: React.ReactPortal[];
  adapter?: NotebookAdapter;
}

export const notebookInitialState: INotebookState = {
  activeCell: undefined,
  kernelStatus: undefined,
  notebookChange: undefined,
  portals: [],
}

/* Selectors */

export const selectNotebook = (): INotebookState =>
  useSelector((state: IState) => {
    if (state.notebook) {
      return state.notebook;
    }
    return notebookInitialState;
  }
);

/* Actions */

export enum ActionType {
  UPDATE = "notebook/UPDATE",
  NOTEBOOK_CHANGE = "notebook/NOTEBOOK_CHANGE",
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
}

const actionCreator = actionCreatorFactory('jupyterReact');

export const notebookActions = {
  update: actionCreator<Partial<INotebookState>>(
    ActionType.UPDATE
  ),
  notebookChange: actionCreator<NotebookChange>(
    ActionType.NOTEBOOK_CHANGE
  ),
  activeCellChange: actionCreator<Cell<ICellModel>>(
    ActionType.ACTIVE_CELL_CHANGE
  ),
  kernelStatusChanged: actionCreator<Kernel.Status>(
    ActionType.KERNEL_STATUS_CHANGE
  ),
  run: actionCreator<void>(
    ActionType.RUN
  ),
  save: actionCreator<void>(
    ActionType.SAVE
  ),
  runAll: actionCreator<void>(
    ActionType.RUN_ALL
  ),
  interrupt: actionCreator<void>(
    ActionType.INTERRUPT
  ),
  portal: actionCreator<React.ReactPortal>(
    ActionType.PORTAL
  ),
  setPortals: actionCreator<React.ReactPortal[]>(
    ActionType.SET_PORTALS
  ),
  insertAbove: actionCreator.async<void, void>(
    ActionType.INSERT_ABOVE
  ),
  insertBelow: actionCreator.async<void, void>(
    ActionType.INSERT_BELOW
  ),
  delete: actionCreator.async<void, void>(
    ActionType.DELETE
  ),
}

/* Epics */

const insertAboveEpic: Epic<
  AnyAction,
  Action<Success<void, void>>,
  IState
> = (action$, state$) =>
  action$.pipe(
    ofAction(notebookActions.insertAbove.started),
    tap(action => {
      state$.value.notebook.adapter?.commands.execute(cmdIds.insertAbove);
    }),
    ignoreElements()
  );

const insertBelowEpic: Epic<
  AnyAction,
  Action<Success<void, void>>,
  IState
> = (action$, state$) =>
  action$.pipe(
    ofAction(notebookActions.insertBelow.started),
    tap(action => {
      state$.value.notebook.adapter?.commands.execute(cmdIds.insertBelow);
    }),
    ignoreElements()
  );

const deleteEpic: Epic<
  AnyAction,
  Action<Success<void, void>>,
  IState
> = (action$, state$) =>
  action$.pipe(
    ofAction(notebookActions.delete.started),
    tap(action => {
      state$.value.notebook.adapter?.commands.execute(cmdIds.deleteCells);
    }),
    ignoreElements()
  );

export const notebookEpics = combineEpics(
  insertAboveEpic,
  insertBelowEpic,
  deleteEpic,
);

/* Reducers */

export const notebookReducer = reducerWithInitialState(notebookInitialState)
  .case(notebookActions.update, (state: INotebookState, update: Partial<INotebookState>) => {
    return {
      ...state,
      ...update,
    }
  })
  .case(notebookActions.run, (state: INotebookState, _: void) => {
    state.adapter && state.adapter.commands.execute(cmdIds.run);
    return state;
  })
  .case(notebookActions.runAll, (state: INotebookState, run: void) => {
    state.adapter && state.adapter.commands.execute(cmdIds.runAll);
    return state;
  })
  .case(notebookActions.interrupt, (state: INotebookState, _: void) => {
    state.adapter && state.adapter.commands.execute(cmdIds.interrupt);
    return state;
  })
  .case(notebookActions.save, (state: INotebookState, _: void) => {
    state.adapter && state.adapter.commands.execute(cmdIds.save);
    return state;
  })
  .case(notebookActions.activeCellChange, (state: INotebookState, activeCell: Cell<ICellModel>) => {
    return {
      ...state,
      activeCell,
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
  .case(notebookActions.portal, (state: INotebookState, portal: React.ReactPortal) => {
    const portals = state.portals.concat(portal);
    return {
      ...state,
      portals,
    }
  })
  .case(notebookActions.setPortals, (state: INotebookState, portals: React.ReactPortal[]) => {
    return {
      ...state,
      portals,
    }
  })
  .case(notebookActions.insertAbove.done, (state: INotebookState, success: Success<void, void>) => {
//    state.adapter && state.adapter.commands.execute(cmdIds.insertAbove);
    return state;
  })
  .case(notebookActions.insertBelow.done, (state: INotebookState, success: Success<void, void>) => {
//    state.adapter && state.adapter.commands.execute(cmdIds.insertBelow);
    return state;
  })
  .case(notebookActions.delete.done, (state: INotebookState, success: Success<void, void>) => {
//    state.adapter && state.adapter.commands.execute(cmdIds.deleteCells);
    return state;
  }
);
