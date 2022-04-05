import { combineReducers } from "redux";
import { initInitialState, initReducer, IInitState } from "./init/InitRedux";
import { cellInitialState, cellReducer, ICellState } from "./../components/cell/CellState";
import { notebookInitialState, notebookReducer, INotebookState } from "./../components/notebook/NotebookState";
import { terminalInitialState, terminalReducer, ITerminalState } from "./../components/terminal/TerminalState";

/* State */

export interface IState {
  counter: IInitState;
  cell: ICellState;
  notebook: INotebookState;
  terminal: ITerminalState;
}

export const initialState: IState = {
  counter: initInitialState,
  cell: cellInitialState,
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

/* Reducers */

export const reducers = combineReducers<IState>({
  counter: initReducer,
  cell: cellReducer,
  notebook: notebookReducer,
  terminal: terminalReducer,
});
