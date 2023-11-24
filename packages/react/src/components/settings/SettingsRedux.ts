import { useSelector } from "react-redux";
import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";

/* State */

export type ISettings = number;

export interface ISettingsState {
  outputs: ISettings;
}

export const settingsInitialState: ISettingsState = {
  outputs: 0,
}

/* Selectors */

export const selectSettings = (): ISettingsState =>
  useSelector((state: ISettingsState) => {
    if ((state as any).settings) {
      return (state as any).settings;
    }
    return {outputs: 0};
  }
);

/* Actions */

export enum SettingsActionType {
  OUTPUTS = "settings/OUTPUTS",
  EXECUTE = "settings/EXECUTE",
}

const actionCreator = actionCreatorFactory('jupyterReact');

export const settingsActions = {
  outputs: actionCreator<number>(
    SettingsActionType.OUTPUTS
  ),
  execute: actionCreator<void>(
    SettingsActionType.EXECUTE
  ),
}

/* Reducers */

export const settingsReducer = reducerWithInitialState(settingsInitialState)
  .case(settingsActions.outputs, (state: ISettingsState, success: number) => {
    return {
      ...state,
      outputs: success
    }
  }
);
