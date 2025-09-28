/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import * as nbformat from '@jupyterlab/nbformat';
import { NotebookCommandIds } from './NotebookCommands';
import { Notebook2Adapter}  from './Notebook2Adapter';

export type INotebook2State = {
  adapter?: Notebook2Adapter;
};

export interface INotebooks2State {
  notebooks: Map<string, INotebook2State>;
}

type CellMutation = {
  id: string;
  cellType: nbformat.CellType;
  source?: string;
};

export type Notebook2State = INotebooks2State & {
  setNotebooks2: (notebooks: Map<string, INotebook2State>) => void;
  selectNotebook2: (id: string) => INotebook2State | undefined;
  selectNotebookAdapter2: (id: string) => Notebook2Adapter | undefined;
  run: (id: string) => void;
  runAll: (id: string) => void;
  interrupt: (id: string) => void;
  insertAbove: (mutation: CellMutation) => void;
  insertBelow: (mutation: CellMutation) => void;
  delete: (id: string) => void;
  changeCellType: (mutation: CellMutation) => void;
  reset: () => void;
};

export const notebookStore2 = createStore<Notebook2State>((set, get) => ({
  notebooks: new Map<string, INotebook2State>(),
  setNotebooks2: (notebooks: Map<string, INotebook2State>) =>
    set((state: Notebook2State) => ({ notebooks })),
  selectNotebook2: (id: string): INotebook2State | undefined => {
    return get().notebooks.get(id);
  },
  selectNotebookAdapter2: (id: string): Notebook2Adapter | undefined => {
    const notebook = get().notebooks.get(id);
    if (notebook) {
      return notebook.adapter;
    }
    return undefined;
  },
  run: (id: string): void => {
    get().notebooks.get(id)?.adapter?.commands.execute(NotebookCommandIds.run);
  },
  runAll: (id: string): void => {
    get()
      .notebooks.get(id)
      ?.adapter?.commands.execute(NotebookCommandIds.runAll);
  },
  interrupt: (id: string): void => {
    get()
      .notebooks.get(id)
      ?.adapter?.commands.execute(NotebookCommandIds.interrupt);
  },
  insertAbove: (mutation: CellMutation) => {
    get()
      .notebooks.get(mutation.id)
      ?.adapter?.setDefaultCellType(mutation.cellType);
    get().notebooks.get(mutation.id)?.adapter?.insertAbove(mutation.source);
  },
  insertBelow: (mutation: CellMutation) => {
    get()
      .notebooks.get(mutation.id)
      ?.adapter?.setDefaultCellType(mutation.cellType);
    get().notebooks.get(mutation.id)?.adapter?.insertBelow(mutation.source);
  },
  delete: (id: string): void => {
    get()
      .notebooks.get(id)
      ?.adapter?.commands.execute(NotebookCommandIds.deleteCells);
  },
  changeCellType: (mutation: CellMutation) => {
    get()
      .notebooks.get(mutation.id)
      ?.adapter?.changeCellType(mutation.cellType);
  },
  reset: () =>
    set((state: Notebook2State) => ({
      notebooks: new Map<string, INotebook2State>(),
    })),
}));

export function useNotebookStore2(): Notebook2State;
export function useNotebookStore2<T>(selector: (state: Notebook2State) => T): T;
export function useNotebookStore2<T>(selector?: (state: Notebook2State) => T) {
  return useStore(notebookStore2, selector!);
}

export default useNotebookStore2;
