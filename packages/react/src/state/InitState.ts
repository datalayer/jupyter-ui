import { useSelector } from "react-redux";
import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";

/* State */

export interface IInitState {
  start?: Date;
}

export const initInitialState: IInitState = {
  start: undefined,
}

/* Selectors */

export const selectStart = (): Date | undefined =>
  useSelector((state: IInitState) => {
    if ((state as any).init) {
      return (state as any).init.start;
    }
    return initInitialState.start;
  }
);

/* Actions */

export enum InitActionType {
  GET_START = "jupyterReact/GET_START",
}

const actionCreator = actionCreatorFactory('jupyterReact');

export const initActions = {
  getStart: actionCreator<Date>(
    InitActionType.GET_START
  ),
}

/* Reducers */

export const initReducer = reducerWithInitialState(initInitialState)
  .case(initActions.getStart, (state: IInitState, start: Date) => {
    return {
      ...state,
      start,
    }
  }
);
