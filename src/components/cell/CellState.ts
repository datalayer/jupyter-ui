import actionCreatorFactory from "typescript-fsa";
import { useSelector } from "react-redux";
import { combineEpics, Epic } from "redux-observable";
import { AnyAction, Action, Success } from "typescript-fsa";
import { map, ignoreElements, tap } from "rxjs/operators";
import { ofAction } from "@datalayer/typescript-fsa-redux-observable";
import CellAdapter from './CellAdapter';
import { reducerWithInitialState } from "typescript-fsa-reducers";

/* State */

export interface ICellState {
  source: string,
  outputsCount: number;
  kernelAvailable: boolean;
}

export const cellInitialState: ICellState = {
  source: '',
  outputsCount: -1,
  kernelAvailable: false,
}

/* Selectors */

export const selectCell = (): ICellState =>
  useSelector((state: ICellState) => {
    if ((state as any).cell) {
      return (state as any).cell;
    }
    return cellInitialState;
  });

/* Actions */

export enum ActionType {
  SOURCE = "cell/SOURCE",
  OUTPUTS_COUNT = "cell/OUTPUTS_COUNT",
  EXECUTE = "cell/EXECUTE",
  UPDATE = "cell/UPDATE",
}

const actionCreator = actionCreatorFactory('jupyterReact');

export const cellActions = {
  source: actionCreator.async<string, string, {}>(
    ActionType.SOURCE
  ),
  outputsCount: actionCreator.async<number, number, {}>(
    ActionType.OUTPUTS_COUNT
  ),
  execute: actionCreator.async<void, void, {}>(
    ActionType.EXECUTE
  ),
  update: actionCreator.async<Partial<ICellState>, Partial<ICellState>, {}>(
    ActionType.UPDATE
  ),
}

/* Epics */

export const cellEpics = (cellAdapter: CellAdapter) => {

  const sourceEpic: Epic<
    AnyAction,
    Action<Success<string, string>>,
    ICellState
  > = action$ =>
    action$.pipe(
      ofAction(cellActions.source.started),
      map(action => {
        return cellActions.source.done({
          params: action.payload,
          result: action.payload
        });
      })
    );

  const outputsCountEpic: Epic<
    AnyAction,
    Action<Success<number, number>>,
    ICellState
  > = action$ =>
    action$.pipe(
      ofAction(cellActions.outputsCount.started),
      map(action => {
        return cellActions.outputsCount.done({
          params: action.payload,
          result: action.payload
        });
      })
    );

  const executeEpic: Epic<
    AnyAction,
    Action<Success<number, number>>,
    ICellState
  > = action$ =>
    action$.pipe(
      ofAction(cellActions.execute.started),
      tap(action => cellAdapter.execute()),
      ignoreElements()
  );

  const updateEpic: Epic<
    AnyAction,
    Action<Success<Partial<ICellState>, Partial<ICellState>>>,
    ICellState
  > = action$ =>
    action$.pipe(
      ofAction(cellActions.update.started),
      map(action => {
        return cellActions.update.done({
          params: action.payload,
          result: action.payload
        })
      })
    );

/*
  const loggingEpic: Epic<
    AnyAction,
    AnyAction,
    ICellState
  > = action$ =>
    action$
      .pipe(
        ofAction(cellActions.outputs.started),
  //      tap(action => console.log(action.type)),
        ignoreElements()
      );
*/
  return combineEpics(
    sourceEpic,
    outputsCountEpic,
    executeEpic,
    updateEpic,
//    loggingEpic,
  );
}

/* Reducers */

export const cellReducer = reducerWithInitialState(cellInitialState)
  .case(cellActions.source.done, (state: ICellState, success: Success<string, string>) => {
    return {
      ...state,
      source: success.result
    }
  })
  .case(cellActions.update.done, (state: ICellState, payload: Success<Partial<ICellState>, Partial<ICellState>>) => ({
    ...state,
    ...payload.result
  }))
  .case(cellActions.outputsCount.done, (state: ICellState, success: Success<number, number>) => {
    return {
      ...state,
      outputsCount: success.result
    }
  }
);
