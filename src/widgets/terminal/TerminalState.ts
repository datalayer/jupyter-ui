import { useSelector } from "react-redux";
import actionCreatorFactory from "typescript-fsa";
import { combineEpics, Epic } from "redux-observable";
import { AnyAction, Action, Success } from "typescript-fsa";
import { map } from "rxjs/operators";
import { ofAction } from "@datalayer/typescript-fsa-redux-observable";
import TerminalAdapter from './TerminalAdapter';
import { reducerWithInitialState } from "typescript-fsa-reducers";

/* State */

export type ITerminal = boolean;

export interface ITerminalState {
  dark: ITerminal;
}

export const terminalInitialState: ITerminalState = {
  dark: false
}

/* Selectors */

export const selectTerminal = (): ITerminalState =>
  useSelector((state: ITerminalState) => {
    if ((state as any).terminal) {
      return (state as any).terminal;
    }
    return { dark: false };
  });

/* Actions */

export enum ActionType {
  DARK = "terminal/DARK",
}

const actionCreator = actionCreatorFactory('jupyterReact');

export const terminalActions = {
  dark: actionCreator.async<boolean, boolean, {}>(
    ActionType.DARK
  ),
}

/* Epics */

export const terminalEpics = (terminalLumino: TerminalAdapter) => {

  const themeEpic: Epic<
    AnyAction,
    Action<Success<boolean, boolean>>,
    ITerminalState
  > = action$ =>
    action$.pipe(
      ofAction(terminalActions.dark.started),
      map(action => {
        (action.payload) ?
          terminalLumino.setTheme('dark')
          :
          terminalLumino.setTheme('light')
        return terminalActions.dark.done({
          params: action.payload,
          result: action.payload
        });
      })
    );

  return combineEpics(
    themeEpic,
  );
}

/* Reducers */

export const terminalReducer = reducerWithInitialState(terminalInitialState)
  .case(terminalActions.dark.done, (state: ITerminalState, success: Success<boolean, boolean>) => {
    return {
      ...state,
      dark: success.result
    }
  }
);
