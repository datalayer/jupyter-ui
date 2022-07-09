import { useSelector } from "react-redux";
import actionCreatorFactory from "typescript-fsa";
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
  }
);

/* Actions */

export enum ActionType {
  OUTPUTS = "Output/OUTPUTS",
  EXECUTE = "Output/EXECUTE",
}

const actionCreator = actionCreatorFactory('jupyterReact');

export const OutputActions = {
  outputs: actionCreator<number>(
    ActionType.OUTPUTS
  ),
  execute: actionCreator<void>(
    ActionType.EXECUTE
  ),
}

/* Reducers */

export const OutputReducer = reducerWithInitialState(outputInitialState)
  .case(OutputActions.outputs, (state: IOutputtate, success: number) => {
    return {
      ...state,
      outputs: success
    }
  }
);
