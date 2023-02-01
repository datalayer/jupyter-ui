import { useSelector } from "react-redux";
import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";

/* State */

export interface IJupyterReactState {
  start?: Date;
}

export const jupyterReactInitialState: IJupyterReactState = {
  start: undefined,
}

/* Selectors */

export const selectStart = (): Date | undefined =>
  useSelector((state: any) => {
    if (state.jupyterReact) {
      return state.jupyterReact.start;
    }
    return jupyterReactInitialState.start;
  }
);

/* Actions */

export enum JupyterReactActionType {
  GET_START = "jupyterReact/GET_START",
}

const actionCreator = actionCreatorFactory('jupyterReact');

export const jupyterReactActions = {
  getStart: actionCreator<Date>(
    JupyterReactActionType.GET_START
  ),
}

/* Reducers */

export const jupyterReactReducer = reducerWithInitialState(jupyterReactInitialState)
  .case(jupyterReactActions.getStart, (state: IJupyterReactState, start: Date) => {
    return {
      ...state,
      start,
    }
  }
);
