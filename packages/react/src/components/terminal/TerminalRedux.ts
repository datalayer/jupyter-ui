import { useSelector } from "react-redux";
import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";
import TerminalAdapter from "./TerminalAdapter";

/* State */

export type ITerminal = boolean;

export interface ITerminalState {
  dark: ITerminal;
  adapter?: TerminalAdapter,
}

export const terminalInitialState: ITerminalState = {
  dark: false,
}

/* Selectors */

export const selectTerminal = (): ITerminalState =>
  useSelector((state: ITerminalState) => {
    if ((state as any).terminal) {
      return (state as any).terminal;
    }
    return terminalInitialState;
  }
);

/* Actions */

export enum TerminalActionType {
  UPDATE = "terminal/UPDATE",
}

const actionCreator = actionCreatorFactory('jupyterReact');

export const terminalActions = {
  update: actionCreator<Partial<ITerminalState>>(TerminalActionType.UPDATE),
}

/* Reducers */

export const terminalReducer = reducerWithInitialState(terminalInitialState)
  .case(terminalActions.update, (state: ITerminalState, update: Partial<ITerminalState>) => {
    if (state.adapter) {
      if (update.dark !== undefined) {
        if (update.dark) {
          state.adapter.setTheme('dark');
        } else {
          state.adapter.setTheme('light');
        }
      }
    }
    return {
      ...state,
      ...update,
    }
  }
);
