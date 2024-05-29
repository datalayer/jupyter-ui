/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import CellAdapter from './CellAdapter';

export interface ICellState {
  source: string;
  outputsCount: number;
  kernelAvailable: boolean;
  adapter?: CellAdapter;
}

export type CellState = ICellState & {
  setSource: (source: string) => void;
  setOutputsCount: (outputsCount: number) => void;
  setKernelAvailable: (kernelAvailable: boolean) => void;
  setAdapter: (adapter?: CellAdapter) => void;
  execute: () => void;
};

export const cellStore = createStore<CellState>((set, get) => ({
  source: '',
  outputsCount: 0,
  kernelAvailable: false,
  adapter: undefined,
  setSource: (source: string) => set((state: CellState) => ({ source })),
  setOutputsCount: (outputsCount: number) => set((state: CellState) => ({ outputsCount })),
  setKernelAvailable: (kernelAvailable: boolean) => set((state: CellState) => ({ kernelAvailable })),
  setAdapter: (adapter?: CellAdapter) => set((state: CellState) => ({ adapter })),
  execute: () => { get().adapter?.execute() },
}));

export function useCellStore(): CellState;
export function useCellStore<T>(selector: (state: CellState) => T): T;
export function useCellStore<T>(selector?: (state: CellState) => T) {
  return useStore(cellStore, selector!);
}

export default useCellStore;
