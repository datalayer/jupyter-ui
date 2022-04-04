import { useSelector } from "react-redux";
import actionCreatorFactory from "typescript-fsa";
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
  }
);

/* Actions */

export enum ActionType {
  INCREMENT_init = "init/INCREMENT_INIT",
  DECREMENT_init = "init/DECREMENT_INIT"
}

const actionCreator = actionCreatorFactory('jupyterReact');

export const initActions = {
  increment: actionCreator<undefined>(
    ActionType.INCREMENT_init
  ),
  decrement: actionCreator<undefined>(
    ActionType.DECREMENT_init
  )
}

/* Reducers */

export const initReducer = reducerWithInitialState(initInitialState)
  .case(initActions.increment, (state: IInitState) => ({
    ...state,
    init: state.init + 1
  }))
  .case(initActions.decrement, (state: IInitState) => {
    return {
      ...state,
      init: state.init - 1
    }
  });

export const initReducers = {
  initReducer: initReducer
}
