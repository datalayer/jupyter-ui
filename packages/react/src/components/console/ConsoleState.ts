import { useSelector } from "react-redux";
import { reducerWithInitialState } from "typescript-fsa-reducers";

/* State */

export type IConsole = number;

export interface IConsoleState {
  outputs: IConsole;
}

export const consoleInitialState: IConsoleState = {
  outputs: 0,
}

/* Selectors */

export const selectConsole = (): IConsoleState =>
  useSelector((state: IConsoleState) => {
    if ((state as any).console) {
      return (state as any).console;
    }
    return {outputs: 0};
  }
);

/* Actions */

import actionCreatorFactory from "typescript-fsa";

export enum ConsoleActionType {
  OUTPUTS = "console/OUTPUTS",
  EXECUTE = "console/EXECUTE",
}

const actionCreator = actionCreatorFactory('jupyterReact');

export const consoleActions = {
  outputs: actionCreator<number>(
    ConsoleActionType.OUTPUTS
  ),
  execute: actionCreator<void>(
    ConsoleActionType.EXECUTE
  ),
}

/* Reducers */

export const consoleReducer = reducerWithInitialState(consoleInitialState)
  .case(consoleActions.outputs, (state: IConsoleState, success: number) => {
    return {
      ...state,
      outputs: success
    }
  }
);
