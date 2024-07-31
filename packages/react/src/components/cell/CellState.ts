/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { CellAdapter } from './CellAdapter';

// Individual, for cell
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
  areAllKernelSessionsReady: boolean;
  isAnyCellExecuting: boolean;
}

export type CellsState = ICellsState & {
  setCells: (cells: Map<string, ICellState>) => void;
  setSource: (id: string, source: string) => void;
  setOutputsCount: (id: string, outputsCount: number) => void;
  setKernelSessionAvailable: (id: string, kernelAvailable: boolean) => void;
  setAdapter: (id: string, adapter?: CellAdapter) => void;
  getAdapter: (id: string) => CellAdapter | undefined;
  getSource: (id: string) => string | undefined;
  getOutputsCount: (id: string) => number | undefined;
  isKernelSessionAvailable: (id: string) => boolean | undefined;
  execute: (id?: string) => void;
  setIsExecuting: (id: string, isExecuting: boolean) => void;
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


export const cellsStore = createStore<CellsState>((set, get) => ({
  cells: new Map<string, ICellState>(),
  source: '',
  outputsCount: 0,
  adapter: undefined,
  areAllKernelSessionsReady: false, // prop refers to all cells
  isAnyCellExecuting: false, // prop refers to all cells,
  setCells: (cells: Map<string, ICellState>) => set((cell: CellsState) => ({ cells })),
  setSource: (id: string, source: string) => {
    const cells = get().cells;
    const cell = cells.get(id);
    if (cell) {
      cell.source = source;
    } else {
      cells.set(id, { source });
    }
    set((cell: CellsState) => ({ cells }))
  },
  setOutputsCount: (id: string, outputsCount: number) => {
    const cells = get().cells;
    const cell = cells.get(id);
    if (cell) {
      cell.outputsCount = outputsCount;
    } else {
      cells.set(id, { outputsCount });
    }
    set((state: CellsState) => ({ cells }));
  },
  setKernelSessionAvailable: (id: string, isKernelSessionAvailable: boolean) => {
    const cells = get().cells;
    const cell = cells.get(id);
    if (cell) {
      cell.isKernelSessionAvailable = isKernelSessionAvailable;
    } else {
      cells.set(id, {isKernelSessionAvailable});
    }
    const areAllKernelSessionsReady = areAllKernelSessionsAvailable(cells);
    set((cell: CellsState) => ({ cells, areAllKernelSessionsReady }));
  },
  setAdapter: (id: string, adapter?: CellAdapter) => {
    const cells = get().cells;
    const cell = cells.get(id);
    if (cell) {
      cell.adapter = adapter;
    } else {
      cells.set(id, { adapter });
    }
    set((cell: CellsState) => ({ cells }))
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
  isKernelSessionAvailable: (id: string): boolean | undefined => {
    return get().cells.get(id)?.isKernelSessionAvailable;
  },
  execute: (id: string) => { 
    const cells = get().cells;
    const cell = cells.get(id);
    if (cell) {
      cell.adapter?.execute();
    } else {
      get().cells.forEach((cell) => cell.adapter?.execute());
    }
  },
  setIsExecuting: (id: string, isExecuting: boolean) => {
    const cells = get().cells;
    const cell = cells.get(id);
    if (cell) {
      cell.isExecuting = isExecuting;
    } else {
      get().cells.forEach((cell) => cell.adapter?.execute())
      cells.set(id, { isExecuting });
    }

    // Also update isAnyCellRunning state (for all cells)
    const isAnyCellExecuting = isAnyCellRunning(cells);
    set((state: CellsState) => ({ cells, isAnyCellExecuting }));
  },
}));

export function useCellsStore(): CellsState;
export function useCellsStore<T>(selector: (state: CellsState) => T): T;
export function useCellsStore<T>(selector?: (state: CellsState) => T) {
  return useStore(cellsStore, selector!);
}

export default useCellsStore;
