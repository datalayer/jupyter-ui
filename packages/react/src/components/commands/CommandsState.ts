import actionCreatorFactory from "typescript-fsa";
import { useSelector } from "react-redux";
import { reducerWithInitialState } from "typescript-fsa-reducers";

/* State */

export type ICommand = number;

export interface ICommandState {
  outputs: ICommand;
}

export const commandsInitialState: ICommandState = {
  outputs: 0
}

/* Selectors */

export const selectCommands = (): ICommandState =>
  useSelector((state: ICommandState) => {
    if ((state as any).commands) {
      return (state as any).commands;
    }
    return {outputs: 0};
  }
);

/* Actions */

export enum CommandsActionType {
  OUTPUTS = "commands/OUTPUTS",
  EXECUTE = "commands/EXECUTE",
}

const actionCreator = actionCreatorFactory('jupyterReact');

export const commandsActions = {
  outputs: actionCreator<number>(
    CommandsActionType.OUTPUTS
  ),
  execute: actionCreator<void>(
    CommandsActionType.EXECUTE
  ),
}

/* Reducers */

export const commandsReducer = reducerWithInitialState(commandsInitialState)
  .case(commandsActions.outputs, (state: ICommandState, success: number) => {
    return {
      ...state,
      outputs: success
    }
  }
);
