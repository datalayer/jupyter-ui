/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import CellAdapter from './CellAdapter';

export interface ICellState {
  source?: string;
  outputsCount?: number;
  adapter?: CellAdapter;
  kernelAvailable?: boolean;
}

export interface ICellsState {
  cells: Map<string, ICellState>;
}

export type CellState = ICellsState & {
  setCells: (cells: Map<string, ICellState>) => void;
  setSource: (id: string, source: string) => void;
  setOutputsCount: (id: string, outputsCount: number) => void;
  setKernelAvailable: (id: string, kernelAvailable: boolean) => void;
  setAdapter: (id: string, adapter?: CellAdapter) => void;
  getAdapter: (id: string) => CellAdapter | undefined;
  getSource: (id: string) => string | undefined;
  getOutputsCount: (id: string) => number | undefined;
  getIsKernelAvaiable: (id: string) => boolean | undefined;
  execute: (id?: string) => void;
};

export const cellStore = createStore<CellState>((set, get) => ({
  cells: new Map<string, ICellState>(),
  source: '',
  outputsCount: 0,
  kernelAvailable: false,
  adapter: undefined,
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
  setKernelAvailable: (id: string, kernelAvailable: boolean) => {
    const cells = get().cells;
    const cell = cells.get(id);
    if (cell) {
      cell.kernelAvailable = kernelAvailable;
    } else {
      cells.set(id, {kernelAvailable});
    }
    set((cell: CellState) => ({ cells }))
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
  getIsKernelAvaiable: (id: string): boolean | undefined => {
    return get().cells.get(id)?.kernelAvailable;
  },
  execute: (id: string) => { 
    const cells = get().cells;
    const cell = cells.get(id);
    if (cell) {
      cell.adapter?.execute() 
    } else {
      get().cells.forEach((cell) => cell.adapter?.execute())
    }
  },
}));

export function useCellStore(): CellState;
export function useCellStore<T>(selector: (state: CellState) => T): T;
export function useCellStore<T>(selector?: (state: CellState) => T) {
  return useStore(cellStore, selector!);
}

export default useCellStore;
