/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { combineReducers } from 'redux';
import { combineEpics } from 'redux-observable';
import { AnyAction } from 'typescript-fsa';
import {
  notebookInitialState,
  notebookEpics,
  notebookReducer,
  INotebooksState,
} from '../../components/notebook/NotebookRedux';
import {
  outputInitialState,
  outputReducer,
  IOutputsState,
} from '../../components/output/OutputRedux';

/* State */

export interface IJupyterReactState {
  output: IOutputsState;
  notebook: INotebooksState;
}

export const initialState: IJupyterReactState = {
  output: outputInitialState,
  notebook: notebookInitialState,
};

/* Actions
export type ActionUnion<
  A extends { [asyncActionCreator: string]: (...args: any[]) => any; }
> = Exclude<ReturnType<A[keyof A]>, (...args: any[]) => Promise<void>>;

export type CellAction = ActionUnion<typeof cellActions>;
export type NotebookAction = ActionUnion<typeof notebookActions>;

export type AppAction = CellAction | NotebookAction;
*/

/* Epics */
export const epics = combineEpics<AnyAction, AnyAction, any>(notebookEpics);

/* Reducers */
export const reducers = combineReducers<IJupyterReactState>({
  output: outputReducer,
  notebook: notebookReducer,
});
