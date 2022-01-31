import { useSelector } from "react-redux";
import actionCreatorFactory from "typescript-fsa";
import { combineEpics, Epic } from "redux-observable";
import { AnyAction, Action, Success } from "typescript-fsa";
import { map, ignoreElements } from "rxjs/operators";
import { ofAction } from "@datalayer/typescript-fsa-redux-observable";
import OutputAdapter from './OutputAdapter';
import { reducerWithInitialState } from "typescript-fsa-reducers";

/* State */

export type IOutput = number;

export interface IOutputtate {
  outputs: IOutput;
}

export const outputInitialState: IOutputtate = {
  outputs: 0
}

/* Selectors */

export const selectOutput = (): IOutputtate =>
  useSelector((state: IOutputtate) => {
    if ((state as any).Output) {
      return (state as any).Output;
    }
    return {outputs: 0};
  });

/* Actions */

export enum ActionType {
  OUTPUTS = "Output/OUTPUTS",
  EXECUTE = "Output/EXECUTE",
}

const actionCreator = actionCreatorFactory('jupyterReact');

export const OutputActions = {
  outputs: actionCreator.async<number, number, {}>(
    ActionType.OUTPUTS
  ),
  execute: actionCreator.async<void, void, {}>(
    ActionType.EXECUTE
  ),
}

/* Epics */

export const OutputEpics = (OutputAdapter: OutputAdapter) => {

  const outputsEpic: Epic<
    AnyAction,
    Action<Success<number, number>>,
    IOutputtate
  > = action$ =>
    action$.pipe(
      ofAction(OutputActions.outputs.started),
      map(action => {
        return OutputActions.outputs.done({
          params: action.payload,
          result: action.payload
        });
      })
    );

  const executeEpic: Epic<
    AnyAction,
    Action<Success<number, number>>,
    IOutputtate
  > = action$ =>
    action$.pipe(
      ofAction(OutputActions.execute.started),
//      tap(action => OutputAdapter.execute()),
      ignoreElements()
  );

  const loggingEpic: Epic<
    AnyAction,
    AnyAction,
    IOutputtate
  > = action$ =>
    action$
      .pipe(
        ofAction(OutputActions.outputs.started),
  //      tap(action => Output.log(action.type)),
        ignoreElements()
      );

  return combineEpics(
    loggingEpic,
    outputsEpic,
    executeEpic,
  );
}

/* Reducers */

export const OutputReducer = reducerWithInitialState(outputInitialState)
  .case(OutputActions.outputs.done, (state: IOutputtate, success: Success<number, number>) => {
    return {
      ...state,
      outputs: success.result
    }
  }
);
