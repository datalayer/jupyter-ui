/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

export enum ExecutionState {
 'busy',
 'connecting',
 'dead',
 'disconnected',
 'idle',
 'initializing',
 'restarting',
 'starting',
 'terminating',
 'unknown',
}

export type IKernelState = {
  id: string;
  executionState?: ExecutionState;
};

export interface IKernelsState {
  kernels: Map<string, IKernelState>;
}

export type KernelsState = IKernelsState & {
  getExecutionState: (id: string) => ExecutionState | undefined;
  setExecutionState: (id: string, executionState: ExecutionState) => void;
};

export const kernelsStore = createStore<KernelsState>((set, get) => ({
  kernels: new Map<string, IKernelState>(),
  getExecutionState: (id: string) => {
    return get().kernels.get(id)?.executionState;
  },
  setExecutionState: (id: string, executionState: ExecutionState) => {
    const kernels = get().kernels;
    const k = kernels.get(id);
    if (k) {
      k.executionState = executionState;
    } else {
      kernels.set(id, {
        id,
        executionState
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
