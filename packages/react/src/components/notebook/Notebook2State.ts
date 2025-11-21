/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import * as nbformat from '@jupyterlab/nbformat';
import { NotebookCommandIds } from './NotebookCommands';
import { Notebook2Adapter } from './Notebook2Adapter';

export type INotebook2State = {
  adapter?: Notebook2Adapter;
};

export interface INotebooks2State {
  notebooks: Map<string, INotebook2State>;
}

export type Notebook2CellMutation = {
  id: string;
  type: nbformat.CellType;
  source?: string;
};

export type InsertCellMutation = {
  id: string;
  type: nbformat.CellType;
  source?: string;
  index: number;
};

export type InsertCellsMutation = {
  id: string;
  cells: Array<{ type: nbformat.CellType; source: string }>;
  index: number;
};

export type Notebook2State = INotebooks2State & {
  setNotebooks2: (notebooks: Map<string, INotebook2State>) => void;
  selectNotebook2: (id: string) => INotebook2State | undefined;
  selectNotebookAdapter2: (id: string) => Notebook2Adapter | undefined;

  // New aligned tool names
  insertCell: (mutation: InsertCellMutation) => void;
  insertCells: (mutation: InsertCellsMutation) => void;
  deleteCell: (id: string) => void;
  updateCell: (mutation: Notebook2CellMutation) => void;
  getCell: (
    id: string,
    index?: number
  ) =>
    | { type: nbformat.CellType; source: string; outputs?: unknown[] }
    | undefined;
  runCell: (id: string) => void;
  runAllCells: (id: string) => void;

  // Backwards compatibility aliases (deprecated)
  run: (id: string) => void;
  runAll: (id: string) => void;
  insertAbove: (mutation: Notebook2CellMutation) => void;
  insertBelow: (mutation: Notebook2CellMutation) => void;
  insertAt: (mutation: InsertCellMutation) => void;
  delete: (id: string) => void;
  changeCellType: (mutation: Notebook2CellMutation) => void;

  // Other methods
  interrupt: (id: string) => void;
  setActiveCell: (id: string, index: number) => void;
  getCells: (
    id: string
  ) => Array<{ type: nbformat.CellType; source: string; outputs?: unknown[] }>;
  getCellCount: (id: string) => number;
  undo: (id: string) => void;
  redo: (id: string) => void;
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
  // New aligned tool names - thin wrappers delegating to adapter
  insertCell: (mutation: InsertCellMutation): void => {
    get()
      .notebooks.get(mutation.id)
      ?.adapter?.insertCell(mutation.type, mutation.index, mutation.source);
  },
  insertCells: (mutation: InsertCellsMutation): void => {
    get()
      .notebooks.get(mutation.id)
      ?.adapter?.insertCells(mutation.cells, mutation.index);
  },
  deleteCell: (id: string): void => {
    get().notebooks.get(id)?.adapter?.deleteCell();
  },
  updateCell: (mutation: Notebook2CellMutation): void => {
    get()
      .notebooks.get(mutation.id)
      ?.adapter?.updateCell(mutation.type, mutation.source);
  },
  getCell: (
    id: string,
    index?: number
  ):
    | { type: nbformat.CellType; source: string; outputs?: unknown[] }
    | undefined => {
    return get().notebooks.get(id)?.adapter?.getCell(index);
  },
  runCell: (id: string): void => {
    get().notebooks.get(id)?.adapter?.runCell();
  },
  runAllCells: (id: string): void => {
    get().notebooks.get(id)?.adapter?.runAllCells();
  },

  // Backwards compatibility aliases (deprecated)
  run: (id: string): void => {
    get().runCell(id);
  },
  runAll: (id: string): void => {
    get().runAllCells(id);
  },
  insertAbove: (mutation: Notebook2CellMutation) => {
    get()
      .notebooks.get(mutation.id)
      ?.adapter?.setDefaultCellType(mutation.type);
    get().notebooks.get(mutation.id)?.adapter?.insertAbove(mutation.source);
  },
  insertBelow: (mutation: Notebook2CellMutation) => {
    get()
      .notebooks.get(mutation.id)
      ?.adapter?.setDefaultCellType(mutation.type);
    get().notebooks.get(mutation.id)?.adapter?.insertBelow(mutation.source);
  },
  insertAt: (mutation: InsertCellMutation): void => {
    get().insertCell(mutation);
  },
  delete: (id: string): void => {
    get().deleteCell(id);
  },
  changeCellType: (mutation: Notebook2CellMutation) => {
    get().notebooks.get(mutation.id)?.adapter?.changeCellType(mutation.type);
  },

  // Other methods
  interrupt: (id: string): void => {
    get()
      .notebooks.get(id)
      ?.adapter?.commands.execute(NotebookCommandIds.interrupt);
  },
  setActiveCell: (id: string, index: number): void => {
    get().notebooks.get(id)?.adapter?.setActiveCell(index);
  },
  getCells: (
    id: string
  ): Array<{
    type: nbformat.CellType;
    source: string;
    outputs?: unknown[];
  }> => {
    return get().notebooks.get(id)?.adapter?.getCells() ?? [];
  },
  getCellCount: (id: string): number => {
    return get().notebooks.get(id)?.adapter?.getCellCount() ?? 0;
  },
  undo: (id: string): void => {
    get().notebooks.get(id)?.adapter?.undo();
  },
  redo: (id: string): void => {
    get().notebooks.get(id)?.adapter?.redo();
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
