/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import {KernelState } from './../../components/kernel/Kernelndicator';

export type IKernelState = {
  id: string;
  kernelState?: KernelState;
};

export interface IKernelsState {
  kernels: Map<string, IKernelState>;
}

export type KernelsState = IKernelsState & {
  getExecutionState: (id: string) => KernelState | undefined;
  setExecutionState: (id: string, executionState: KernelState) => void;
};

export const kernelsStore = createStore<KernelsState>((set, get) => ({
  kernels: new Map<string, IKernelState>(),
  getExecutionState: (id: string) => {
    return get().kernels.get(id)?.kernelState;
  },
  setExecutionState: (id: string, executionState: KernelState) => {
    const kernels = get().kernels;
    const k = kernels.get(id);
    if (k) {
      k.kernelState = executionState;
    } else {
      kernels.set(id, {
        id,
        kernelState: executionState
      });
    }
    set((state: KernelsState) => ({ kernels }))
  },
}));

export function useKernelsStore(): KernelsState;
export function useKernelsStore<T>(selector: (state: KernelsState) => T): T;
export function useKernelsStore<T>(selector?: (state: KernelsState) => T) {
  return useStore(kernelsStore, selector!);
}

export default useKernelsStore;
