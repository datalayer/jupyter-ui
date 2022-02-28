import { combineReducers } from "redux";
import { combineEpics } from "redux-observable";
import { AnyAction } from "typescript-fsa";
import { initReducer, initInitialState, IInitState, initEpics } from "./init/InitRedux";
// import { cellActions } from "../widgets/cell/CellState";
// import { notebookActions } from "../widgets/notebook/NotebookState";

/* State */

export interface IState {
  counter: IInitState;
}

export const initialState: IState = {
  counter: initInitialState
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
  initEpics
);

/* Reducers */

export const reducers = combineReducers<IState>({
  counter: initReducer
});
