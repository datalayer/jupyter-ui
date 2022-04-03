import actionCreatorFactory from "typescript-fsa";
import { useSelector } from "react-redux";
import { combineEpics, Epic } from "redux-observable";
import { AnyAction, Action, Success } from "typescript-fsa";
import { map, ignoreElements } from "rxjs/operators";
import { ofAction } from "@datalayer/typescript-fsa-redux-observable";
import FileBrowserAdapter from './FileBrowserAdapter';
import { reducerWithInitialState } from "typescript-fsa-reducers";

/* State */

export type IFileBrowser = number;

export interface IFileBrowserState {
  outputs: IFileBrowser;
}

export const fileBrowserInitialState: IFileBrowserState = {
  outputs: 0
}

/* Selectors */

export const selectFileBrowser = (): IFileBrowserState =>
  useSelector((state: IFileBrowserState) => {
    if ((state as any).fileBrowser) {
      return (state as any).fileBrowser;
    }
    return {outputs: 0};
  });

/* Actions */

export enum ActionType {
  OUTPUTS = "fileBrowser/OUTPUTS",
  EXECUTE = "fileBrowser/EXECUTE",
}

const actionCreator = actionCreatorFactory('jupyterReact');

export const fileBrowserActions = {
  outputs: actionCreator.async<number, number, {}>(
    ActionType.OUTPUTS
  ),
  execute: actionCreator.async<void, void, {}>(
    ActionType.EXECUTE
  ),
}

/* Epics */

export const fileBrowserEpics = (fileBrowserLumino: FileBrowserAdapter) => {

  const outputsEpic: Epic<
    AnyAction,
    Action<Success<number, number>>,
    IFileBrowserState
  > = action$ =>
    action$.pipe(
      ofAction(fileBrowserActions.outputs.started),
      map(action => {
        return fileBrowserActions.outputs.done({
          params: action.payload,
          result: action.payload
        });
      })
    );

  const executeEpic: Epic<
    AnyAction,
    Action<Success<number, number>>,
    IFileBrowserState
  > = action$ =>
    action$.pipe(
      ofAction(fileBrowserActions.execute.started),
//      tap(action => fileBrowserLumino.execute()),
      ignoreElements()
  );

  const loggingEpic: Epic<
    AnyAction,
    AnyAction,
    IFileBrowserState
  > = action$ =>
    action$
      .pipe(
        ofAction(fileBrowserActions.outputs.started),
  //      tap(action => fileBrowser.log(action.type)),
        ignoreElements()
      );

  return combineEpics(
    loggingEpic,
    outputsEpic,
    executeEpic,
  );
}

/* Reducers */

export const fileBrowserReducer = reducerWithInitialState(fileBrowserInitialState)
  .case(fileBrowserActions.outputs.done, (state: IFileBrowserState, success: Success<number, number>) => {
    return {
      ...state,
      outputs: success.result
    }
  }
);
