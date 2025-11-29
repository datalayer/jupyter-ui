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

export type Notebook2State = INotebooks2State & {
  // Core store methods
  setNotebooks2: (notebooks: Map<string, INotebook2State>) => void;
  selectNotebook2: (id: string) => INotebook2State | undefined;
  selectNotebookAdapter2: (id: string) => Notebook2Adapter | undefined;

  // Tool operation methods (1:1 with tool operations) - individual parameters
  // Note: params after id are optional because executor passes them as object: { id, ...params }
  insertCell: (
    id: string,
    type?: nbformat.CellType,
    index?: number,
    source?: string
  ) => void;
  insertCells: (
    id: string,
    cells?: Array<{ type: string; source: string }>,
    index?: number
  ) => void;
  deleteCell: (id: string, index?: number) => void;
  updateCell: (id: string, index?: number, source?: string) => void;
  readCell: (
    id: string,
    index?: number,
    includeOutputs?: boolean
  ) =>
    | {
        type: nbformat.CellType;
        source: string;
        execution_count?: number | null;
        outputs?: unknown[];
      }
    | undefined;
  readAllCells: (
    id: string,
    format?: 'brief' | 'detailed'
  ) => Array<{
    index: number;
    type: string;
    preview?: string;
    source?: string;
    execution_count?: number | null;
    outputs?: unknown[];
  }>;
  executeCode: (
    id: string,
    code?: string
  ) => Promise<{
    success: boolean;
    outputs?: unknown[];
    error?: string;
  }>;
  runCell: (
    id: string
  ) => Promise<
    { execution_count?: number | null; outputs?: Array<string> } | undefined
  >;
  runAllCells: (id: string) => void;

  // Original methods (from legacy API)
  run: (id: string) => void;
  runAll: (id: string) => void;
  interrupt: (id: string) => void;
  insertAbove: (id: string, type: nbformat.CellType, source?: string) => void;
  insertBelow: (id: string, type: nbformat.CellType, source?: string) => void;
  delete: (id: string) => void;
  changeCellType: (id: string, type: nbformat.CellType) => void;
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
  // Tool operation methods - use individual parameters in signature, destructure in implementation
  insertCell: (
    id: string,
    type?: nbformat.CellType,
    index?: number,
    source?: string
  ): void => {
    // Accept object from executor, destructure it
    const params = typeof id === 'object' ? id : { id, type, index, source };
    get()
      .notebooks.get(params.id as string)
      ?.adapter?.insertCell(
        params.type as nbformat.CellType,
        params.index,
        params.source as string | undefined
      );
  },
  insertCells: (id: string, cells?: unknown[], index?: number): void => {
    const params = typeof id === 'object' ? id : { id, cells, index };
    get()
      .notebooks.get(params.id as string)
      ?.adapter?.insertCells(
        params.cells as Array<{ type: nbformat.CellType; source: string }>,
        params.index as number
      );
  },
  deleteCell: (id: string, index?: number): void => {
    const params = typeof id === 'object' ? id : { id, index };
    get().notebooks.get(params.id)?.adapter?.deleteCell(params.index);
  },
  updateCell: (id: string, index?: number, source?: string): void => {
    const params = typeof id === 'object' ? id : { id, index, source };
    get()
      .notebooks.get(params.id as string)
      ?.adapter?.updateCell(params.index as number, params.source as string);
  },
  readCell: (
    id: string,
    index?: number,
    includeOutputs?: boolean
  ):
    | {
        type: nbformat.CellType;
        source: string;
        execution_count?: number | null;
        outputs?: unknown[];
      }
    | undefined => {
    const params = typeof id === 'object' ? id : { id, index, includeOutputs };
    return get()
      .notebooks.get(params.id as string)
      ?.adapter?.getCell(params.index as number, params.includeOutputs ?? true);
  },
  readAllCells: (
    id: string,
    format?: 'brief' | 'detailed'
  ): Array<{
    index: number;
    type: string;
    preview?: string;
    source?: string;
    execution_count?: number | null;
    outputs?: unknown[];
  }> => {
    const params = typeof id === 'object' ? id : { id, format };
    return (
      get()
        .notebooks.get(params.id as string)
        ?.adapter?.readAllCells(params.format as 'brief' | 'detailed') ?? []
    );
  },
  executeCode: async (
    id: string,
    code?: string
  ): Promise<{
    success: boolean;
    outputs?: unknown[];
    error?: string;
  }> => {
    const params = typeof id === 'object' ? id : { id, code };
    return (
      (await get()
        .notebooks.get(params.id as string)
        ?.adapter?.executeCode(params.code as string)) ?? {
        success: false,
        error: 'Adapter not found',
      }
    );
  },
  runCell: async (
    id: any
  ): Promise<
    { execution_count?: number | null; outputs?: Array<string> } | undefined
  > => {
    const params = typeof id === 'object' ? id : { id };
    const adapter = get().notebooks.get(params.id)?.adapter;
    if (!adapter) {
      return undefined;
    }
    return await adapter.runCell(params);
  },
  runAllCells: (id: any): void => {
    const params = typeof id === 'object' ? id : { id };
    get().notebooks.get(params.id)?.adapter?.runAllCells();
  },

  // Original methods (from legacy API)
  run: (id: string): void => {
    get().notebooks.get(id)?.adapter?.runCell();
  },
  runAll: (id: string): void => {
    get().notebooks.get(id)?.adapter?.runAllCells();
  },
  interrupt: (id: string): void => {
    get()
      .notebooks.get(id)
      ?.adapter?.commands.execute(NotebookCommandIds.interrupt);
  },
  insertAbove: (id: string, type: nbformat.CellType, source?: string) => {
    get().notebooks.get(id)?.adapter?.setDefaultCellType(type);
    get().notebooks.get(id)?.adapter?.insertAbove(source);
  },
  insertBelow: (id: string, type: nbformat.CellType, source?: string) => {
    get().notebooks.get(id)?.adapter?.setDefaultCellType(type);
    get().notebooks.get(id)?.adapter?.insertBelow(source);
  },
  delete: (id: string): void => {
    get().notebooks.get(id)?.adapter?.deleteCell();
  },
  changeCellType: (id: string, type: nbformat.CellType) => {
    get().notebooks.get(id)?.adapter?.changeCellType(type);
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
