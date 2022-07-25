import actionCreatorFactory from "typescript-fsa";
import { useSelector } from "react-redux";
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
  }
);

/* Actions */

export enum FileBrowserActionType {
  OUTPUTS = "fileBrowser/OUTPUTS",
  EXECUTE = "fileBrowser/EXECUTE",
}

const actionCreator = actionCreatorFactory('jupyterReact');

export const fileBrowserActions = {
  outputs: actionCreator<number>(
    FileBrowserActionType.OUTPUTS
  ),
  execute: actionCreator<void>(
    FileBrowserActionType.EXECUTE
  ),
}

/* Reducers */

export const fileBrowserReducer = reducerWithInitialState(fileBrowserInitialState)
  .case(fileBrowserActions.outputs, (state: IFileBrowserState, success: number) => {
    return {
      ...state,
      outputs: success,
    }
  }
);
