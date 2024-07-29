/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import CellAdapter from './CellAdapter';

// Individual, for each cell
export interface ICellState {
  source?: string;
  outputsCount?: number;
  adapter?: CellAdapter;
  isKernelSessionAvailable?: boolean;
  isExecuting?: boolean;
}

// For all cells
export interface ICellsState {
  cells: Map<string, ICellState>;
  areAllKernelSessionsReady: boolean; // Control if all cells has sessions available
  isAnyCellExecuting: boolean; // Control if at least one cell is executing
}

export type CellState = ICellsState & {
  setCells: (cells: Map<string, ICellState>) => void;
  setSource: (id: string, source: string) => void;
  setOutputsCount: (id: string, outputsCount: number) => void;
  setAdapter: (id: string, adapter?: CellAdapter) => void;
  setIsKernelSessionAvailable: (id: string, kernelAvailable: boolean) => void;
  getSource: (id: string) => string | undefined;
  getOutputsCount: (id: string) => number | undefined;
  getAdapter: (id: string) => CellAdapter | undefined;
  getIsKernelSessionAvailable: (id: string) => boolean | undefined;
  execute: (id?: string) => void;
  setIsExecuting: (id: string, isExecuting: boolean) => void; // Necessary for the cases when execute directly from jupyterlab/cells
};

/**
 * Iterate over all cells map and check if all cells/sessions are ready
 */
const areAllKernelSessionsAvailable = (cells: Map<string, ICellState>): boolean => {
  for (const cell of cells.values()) {
    if (!cell.isKernelSessionAvailable) {
      return false;
    }
  }
  return true;
};

/**
 * Check if any cell is currently executing
 */
export const isAnyCellRunning = (cells: Map<string, ICellState>): boolean => {
  for (const cell of cells.values()) {
    if (cell.isExecuting) {
      return true;
    }
  }
  return false;
};

export const cellStore = createStore<CellState>((set, get) => ({
  cells: new Map<string, ICellState>(),
  source: '',
  outputsCount: 0,
  adapter: undefined,
  isKernelSessionAvailable: false,
  isExecuting: false,
  areAllKernelSessionsReady: false, // prop refers to all cells
  isAnyCellExecuting: false, // prop refers to all cells
  setCells: (cells: Map<string, ICellState>) => set((cell: CellState) => ({ cells })),

  setSource: (id: string, source: string) => {
    const cells = get().cells;
    const cell = cells.get(id);
    if (cell) {
      cell.source = source;
    } else {
      cells.set(id, {source});
    }
    set((cell: CellState) => ({ cells }))
  },
  setOutputsCount: (id: string, outputsCount: number) => {
    const cells = get().cells;
    const cell = cells.get(id);
    if (cell) {
      cell.outputsCount = outputsCount;
    } else {
      cells.set(id, {outputsCount});
    }
    set((state: CellState) => ({ cells }))
  },
  setIsKernelSessionAvailable: (id: string, isKernelSessionAvailable: boolean) => {
    const cells = get().cells;
    const cell = cells.get(id);
    if (cell) {
      cell.isKernelSessionAvailable = isKernelSessionAvailable;
    } else {
      cells.set(id, {isKernelSessionAvailable});
    }
    const areAllKernelSessionsReady = areAllKernelSessionsAvailable(cells);
    set((cell: CellState) => ({ cells, areAllKernelSessionsReady }));
  },
  setAdapter: (id: string, adapter?: CellAdapter) => {
    const cells = get().cells;
    const cell = cells.get(id);
    if (cell) {
      cell.adapter = adapter;
    } else {
      cells.set(id, { adapter });
    }
    set((cell: CellState) => ({ cells }))
  },
  getAdapter: (id: string) => {
    return get().cells.get(id)?.adapter;
  },
  getSource: (id: string): string | undefined => {
    return get().cells.get(id)?.source;
  },
  getOutputsCount: (id: string): number | undefined => {
    return get().cells.get(id)?.outputsCount;
  },
  getIsKernelSessionAvailable: (id: string): boolean | undefined => {
    return get().cells.get(id)?.isKernelSessionAvailable;
  },
  execute: (id: string) => { 
    const cells = get().cells;
    const cell = cells.get(id);
    if (cell) {
      cell.adapter?.execute();
      cell.isExecuting = true;
    } else {
      get().cells.forEach((cell) => {
        cell.adapter?.execute();
        cell.isExecuting = true;
      });
    }
    const isAnyCellExecuting = isAnyCellRunning(cells);
    set((state: CellState) => ({ cells, isAnyCellExecuting }));
  },
  setIsExecuting: (id: string, isExecuting: boolean) => {
    /**
     * Set is executing
     * This is necessary to update state in cases when we execute directly from jupyterlab/cells
     */
    const cells = get().cells;
    const cell = cells.get(id);
    if (cell) {
      cell.isExecuting = isExecuting;
    } else {
      cells.set(id, { isExecuting });
    }

    const isAnyCellExecuting = isAnyCellRunning(cells);
    set((state: CellState) => ({ cells, isAnyCellExecuting }));
  },
}));

export function useCellStore(): CellState;
export function useCellStore<T>(selector: (state: CellState) => T): T;
export function useCellStore<T>(selector?: (state: CellState) => T) {
  return useStore(cellStore, selector!);
}

export default useCellStore;
