import { useSelector } from "react-redux";
import actionCreatorFactory, { AnyAction, Action, Success } from "typescript-fsa";
import { combineEpics, Epic } from "redux-observable";
import { map, ignoreElements, tap } from "rxjs/operators";
import { ofAction } from "@datalayer/typescript-fsa-redux-observable";
import { reducerWithInitialState } from "typescript-fsa-reducers";
import { NotebookChange } from "@jupyterlab/shared-models";
import { Cell, ICellModel } from "@jupyterlab/cells";
import { Kernel } from "@jupyterlab/services";
import NotebookAdapter from './NotebookAdapter';

/* State */

export interface INotebookState {
  activeCell: Cell<ICellModel> | undefined;
  kernelStatus: Kernel.Status | undefined;
  notebookChange: NotebookChange | undefined;
  portals: React.ReactPortal[];
}

export const notebookInitialState: INotebookState = {
  activeCell: undefined,
  kernelStatus: undefined,
  notebookChange: undefined,
  portals: [],
}

/* Selectors */

export const selectNotebook = (): INotebookState =>
  useSelector((state: INotebookState) => {
    if ((state as any).notebook) {
      return (state as any).notebook;
    }
    return notebookInitialState;
  });

/* Actions */

export enum ActionType {
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
  notebookChange: actionCreator.async<NotebookChange, NotebookChange, {}>(
    ActionType.NOTEBOOK_CHANGE
  ),
  activeCellChange: actionCreator.async<Cell<ICellModel>, Cell<ICellModel>, {}>(
    ActionType.ACTIVE_CELL_CHANGE
  ),
  kernelStatusChanged: actionCreator.async<Kernel.Status, Kernel.Status, {}>(
    ActionType.KERNEL_STATUS_CHANGE
  ),
  run: actionCreator.async<void, void, {}>(
    ActionType.RUN
  ),
  save: actionCreator.async<void, void, {}>(
    ActionType.SAVE
  ),
  runAll: actionCreator.async<void, void, {}>(
    ActionType.RUN_ALL
  ),
  interrupt: actionCreator.async<void, void, {}>(
    ActionType.INTERRUPT
  ),
  insertAbove: actionCreator.async<void, void, {}>(
    ActionType.INSERT_ABOVE
  ),
  insertBelow: actionCreator.async<void, void, {}>(
    ActionType.INSERT_BELOW
  ),
  delete: actionCreator.async<void, void, {}>(
    ActionType.DELETE
  ),
  portal: actionCreator.async<React.ReactPortal, React.ReactPortal[], {}>(
    ActionType.PORTAL
  ),
  setPortals: actionCreator.async<React.ReactPortal[], React.ReactPortal[], {}>(
    ActionType.SET_PORTALS
  ),
}

/* Epics */

export const notebookEpics = (notebookLumino: NotebookAdapter) => {

  const activeCellChangeEpic: Epic<
    AnyAction,
    Action<Success<Cell<ICellModel>, Cell<ICellModel>>>,
    INotebookState
  > = action$ =>
    action$.pipe(
      ofAction(notebookActions.activeCellChange.started),
      map(action => {
        return notebookActions.activeCellChange.done({
          params: action.payload,
          result: action.payload
        });
      })
    );

  const notebookChangeEpic: Epic<
    AnyAction,
    Action<Success<NotebookChange, NotebookChange>>,
    INotebookState
  > = action$ =>
    action$.pipe(
      ofAction(notebookActions.notebookChange.started),
      map(action => {
        return notebookActions.notebookChange.done({
          params: action.payload,
          result: action.payload
        });
      })
    );

  const kernelStatusChangeEpic: Epic<
    AnyAction,
    Action<Success<Kernel.Status, Kernel.Status>>,
    INotebookState
  > = action$ =>
    action$.pipe(
      ofAction(notebookActions.kernelStatusChanged.started),
      map(action => {
        return notebookActions.kernelStatusChanged.done({
          params: action.payload,
          result: action.payload
        });
      })
    );

  const runEpic: Epic<
    AnyAction,
    Action<Success<void, void>>,
    INotebookState
  > = action$ =>
    action$.pipe(
      ofAction(notebookActions.run.started),
      tap(action => {
        notebookLumino.commands.execute('notebook:run-cell');
      }),
      ignoreElements()
  );

  const runAllEpic: Epic<
    AnyAction,
    Action<Success<void, void>>,
    INotebookState
  > = action$ =>
    action$.pipe(
      ofAction(notebookActions.runAll.started),
      tap(action => {
        notebookLumino.commands.execute('notebook:run-all-cells');
      }),
      ignoreElements()
  );

  const saveEpic: Epic<
    AnyAction,
    Action<Success<void, void>>,
    INotebookState
  > = action$ =>
    action$.pipe(
      ofAction(notebookActions.save.started),
      tap(action => {
        notebookLumino.commands.execute('notebook:save');
      }),
      ignoreElements()
  );

  const interruptEpic: Epic<
    AnyAction,
    Action<Success<void, void>>,
    INotebookState
  > = action$ =>
    action$.pipe(
      ofAction(notebookActions.interrupt.started),
      tap(action => {
        notebookLumino.commands.execute('notebook:interrupt-kernel');
      }),
      ignoreElements()
  );

  const insertAboveEpic: Epic<
    AnyAction,
    Action<Success<void, void>>,
    INotebookState
  > = action$ =>
    action$.pipe(
      ofAction(notebookActions.insertAbove.started),
      tap(action => {
        notebookLumino.commands.execute('notebook-cells:insert-above');
      }),
      ignoreElements()
  );

  const insertBelowEpic: Epic<
    AnyAction,
    Action<Success<void, void>>,
    INotebookState
  > = action$ =>
    action$.pipe(
      ofAction(notebookActions.insertBelow.started),
      tap(action => {
        notebookLumino.commands.execute('notebook-cells:insert-below');
      }),
      ignoreElements()
  );

  const deleteEpic: Epic<
    AnyAction,
    Action<Success<void, void>>,
    INotebookState
  > = action$ =>
    action$.pipe(
      ofAction(notebookActions.delete.started),
      tap(action => {
        notebookLumino.commands.execute('notebook-cells:delete');
      }),
      ignoreElements()
  );

  const portalEpic: Epic<
    AnyAction,
    Action<Success<React.ReactPortal, React.ReactPortal[]>>,
    INotebookState
  > = action$ =>
    action$.pipe(
      ofAction(notebookActions.portal.started),
      map(action => {
        return notebookActions.portal.done({
          params: action.payload,
          result: [action.payload]
        });
      })
  );

  const setPortalsEpic: Epic<
    AnyAction,
    Action<Success<React.ReactPortal[], React.ReactPortal[]>>,
    INotebookState
  > = action$ =>
    action$.pipe(
      ofAction(notebookActions.setPortals.started),
      map(action => {
        return notebookActions.setPortals.done({
          params: action.payload,
          result: action.payload
        });
      })
  );
/*
  const loggingEpic: Epic<
    AnyAction,
    AnyAction,
    INotebookState
  > = action$ =>
    action$
      .pipe(
        ofAction(
          notebookActions.notebookChange.started,
          notebookActions.setPortals.started,
        ),
        tap(action => console.log(action.type)),
        ignoreElements()
      );
*/
  return combineEpics(
    portalEpic,
    activeCellChangeEpic,
    kernelStatusChangeEpic,
    notebookChangeEpic,
    runEpic,
    runAllEpic,
    saveEpic,
    interruptEpic,
    insertAboveEpic,
    insertBelowEpic,
    deleteEpic,
    setPortalsEpic,
//    loggingEpic,
  );
}

/* Reducers */

export const notebookReducer = reducerWithInitialState(notebookInitialState)
  .case(notebookActions.activeCellChange.done, (state: INotebookState, success: Success<Cell<ICellModel>, Cell<ICellModel>>) => {
    return {
      ...state,
      activeCell: success.result,
    }
  })
  .case(notebookActions.notebookChange.done, (state: INotebookState, success: Success<NotebookChange, NotebookChange>) => {
    return {
      ...state,
      notebookChange: success.result,
//      portals: new Array<React.ReactPortal>(),
    }
  })
  .case(notebookActions.kernelStatusChanged.done, (state: INotebookState, success: Success<Kernel.Status, Kernel.Status>) => {
    return {
      ...state,
      kernelStatus: success.result,
    }
  })
  .case(notebookActions.portal.done, (state: INotebookState, success: Success<React.ReactPortal, React.ReactPortal[]>) => {
    const portals = state.portals.concat(success.result);
//    console.log('---', portals)
    return {
      ...state,
      portals,
    }
  })
  .case(notebookActions.setPortals.done, (state: INotebookState, success: Success<React.ReactPortal[], React.ReactPortal[]>) => {
    return {
      ...state,
      portals: success.result,
    }
  });
