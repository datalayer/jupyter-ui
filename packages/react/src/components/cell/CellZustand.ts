/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import CellAdapter from './CellAdapter';
import { ICellState } from './CellState';

export type CellZustandState = ICellState & {
  setSource: (source: string) => void;
  setOutputsCount: (outputsCount: number) => void;
  setKernelAvailable: (kernelAvailable: boolean) => void;
  setAdapter: (adapter?: CellAdapter) => void;
  execute: () => void;
};

export const cellStore = createStore<CellZustandState>((set, get) => ({
  source: '',
  outputsCount: 0,
  kernelAvailable: false,
  adapter: undefined,
  setSource: (source: string) => set((state: CellZustandState) => ({ source })),
  setOutputsCount: (outputsCount: number) => set((state: CellZustandState) => ({ outputsCount })),
  setKernelAvailable: (kernelAvailable: boolean) => set((state: CellZustandState) => ({ kernelAvailable })),
  setAdapter: (adapter?: CellAdapter) => set((state: CellZustandState) => ({ adapter })),
  execute: () => { get().adapter?.execute() },
}));

export function useCellStore(): CellZustandState;
export function useCellStore<T>(selector: (state: CellZustandState) => T): T;
export function useCellStore<T>(selector?: (state: CellZustandState) => T) {
  return useStore(cellStore, selector!);
}

export default useCellStore;
