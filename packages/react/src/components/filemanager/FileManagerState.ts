import actionCreatorFactory from "typescript-fsa";
import { useSelector } from "react-redux";
import { reducerWithInitialState } from "typescript-fsa-reducers";

/* State */

export type IFileManager = number;

export interface IFileManagerState {
  outputs: IFileManager;
}

export const fileBrowserInitialState: IFileManagerState = {
  outputs: 0
}

/* Selectors */

export const selectFileManager = (): IFileManagerState =>
  useSelector((state: IFileManagerState) => {
    if ((state as any).fileBrowser) {
      return (state as any).fileBrowser;
    }
    return {outputs: 0};
  }
);

/* Actions */

export enum FileManagerActionType {
  OUTPUTS = "fileBrowser/OUTPUTS",
  EXECUTE = "fileBrowser/EXECUTE",
}

const actionCreator = actionCreatorFactory('jupyterReact');

export const fileBrowserActions = {
  outputs: actionCreator<number>(
    FileManagerActionType.OUTPUTS
  ),
  execute: actionCreator<void>(
    FileManagerActionType.EXECUTE
  ),
}

/* Reducers */

export const fileBrowserReducer = reducerWithInitialState(fileBrowserInitialState)
  .case(fileBrowserActions.outputs, (state: IFileManagerState, success: number) => {
    return {
      ...state,
      outputs: success,
    }
  }
);
