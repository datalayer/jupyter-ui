import { combineReducers } from "redux";
import { combineEpics } from "redux-observable";
import { AnyAction } from "typescript-fsa";
import { initInitialState, initReducer } from "./InitState";
import { cellInitialState, cellReducer, ICellState } from "../components/cell/CellState";
import { notebookInitialState, notebookEpics, notebookReducer, INotebooksState } from "../components/notebook/NotebookState";
import { terminalInitialState, terminalReducer, ITerminalState } from "../components/terminal/TerminalState";
import { outputInitialState, outputReducer, IOutputsState } from "../components/output/OutputState";

/* State */

export interface IJupyterReactState {
  init: any;
  cell: ICellState;
  output: IOutputsState;
  notebook: INotebooksState;
  terminal: ITerminalState;
}

export const initialState: IJupyterReactState = {
  init: initInitialState,
  cell: cellInitialState,
  output: outputInitialState,
  notebook: notebookInitialState,
  terminal: terminalInitialState,
}

/* Actions
export type ActionUnion<
  A extends { [asyncActionCreator: string]: (...args: any[]) => any; }
> = Exclude<ReturnType<A[keyof A]>, (...args: any[]) => Promise<void>>;

export type CellAction = ActionUnion<typeof cellActions>;
export type NotebookAction = ActionUnion<typeof notebookActions>;

export type AppAction = CellAction | NotebookAction;
*/

/* Epics */
export const epics = combineEpics<AnyAction, AnyAction, any>(
  notebookEpics,
);

/* Reducers */
export const reducers = combineReducers<IJupyterReactState>({
  init: initReducer,
  cell: cellReducer,
  output: outputReducer,
  notebook: notebookReducer,
  terminal: terminalReducer,
});
