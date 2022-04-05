import { useSelector } from "react-redux";
import actionCreatorFactory from "typescript-fsa";
import { combineEpics, Epic } from "redux-observable";
import { AnyAction, Action, Success } from "typescript-fsa";
import { delay, map, tap, ignoreElements } from "rxjs/operators";
import { ofAction } from "@datalayer/typescript-fsa-redux-observable";
import { reducerWithInitialState } from "typescript-fsa-reducers";

/* State */

export type IInit = number;

export interface IInitState {
  init: IInit;
}

export const initInitialState: IInitState = {
  init: 0
}

/* Selectors */

export const selectInit = () =>
  useSelector((state: IInitState) => {
    return (state as any).initReducer.init;
  });

/* Actions */

export enum ActionType {
  INCREMENT = "init/INCREMENT",
  DECREMENT = "init/DECREMENT"
}

const actionCreator = actionCreatorFactory('jupyterReact');

export const initActions = {
  increment: actionCreator.async<void, void>(
    ActionType.INCREMENT
  ),
  decrement: actionCreator.async<void, void>(
    ActionType.DECREMENT
  )
}

/* Epics */

const initIncrementEpic: Epic<
  AnyAction,
  Action<Success<void, void>>,
  IInitState
> = action$ =>  
  action$.pipe(
    ofAction(initActions.increment.started),
    delay(2000),
    map(action =>
      initActions.increment.done({
        params: action.payload,
        result: undefined
      })
    )
  );

const initDecrementEpic: Epic<
  AnyAction,
  Action<Success<void, void>>,
  Success<any, any>
> = action$ => {
  return action$.pipe(
    ofAction(initActions.decrement.started),
    delay(100),
    map(action =>
      initActions.decrement.done({
        params: action.payload,
        result: undefined
      })
    )
  );
}

const loggingEpic: Epic<
  AnyAction,
  AnyAction,
  Success<any, any>
> = action$ =>
  action$
    .pipe(
      ofAction(
        initActions.decrement.started,
      ),
      tap(action => console.log(action.type)),
      ignoreElements()
    ).pipe(
      ofAction(initActions.increment.started),
      tap(action => console.log(action.type)),
      ignoreElements()
    );

export const initEpics = combineEpics(
  initIncrementEpic,
  initDecrementEpic,
  loggingEpic
);

/* Reducers */

export const initReducer = reducerWithInitialState(initInitialState)
  .case(initActions.increment.done, (state: IInitState) => ({
    ...state,
    init: state.init + 1
  }))
  .case(initActions.decrement.done, (state: IInitState) => {
    return {
      ...state,
      init: state.init - 1
    }
  });

export const initReducers = {
  initReducer: initReducer
}
