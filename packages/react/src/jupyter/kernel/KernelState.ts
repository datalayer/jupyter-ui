/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { ExecutionState } from './../../components/kernel/KernelIndicator';

export enum ExecutionPhase {
  ready_to_run = 'READY_TO_RUN',
  running = 'RUNNING',
  completed = 'COMPLETED',
  completed_with_error = 'COMPLETED_WITH_ERROR',
  completed_with_warning = 'COMPLETED_WITH_WARNING',
}

export type IKernelState = {
  id: string;
  executionState?: ExecutionState;
  executionPhase?: ExecutionPhase;
};

export interface IKernelsState {
  kernels: Map<string, IKernelState>;
}

export type KernelsState = IKernelsState & {
  getExecutionState: (id: string) => ExecutionState | undefined;
  setExecutionState: (id: string, executionState: ExecutionState) => void;
  getExecutionPhase: (id: string) => ExecutionPhase | undefined;
  setExecutionPhase: (id: string, executionState: ExecutionPhase) => void;
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
        executionState: executionState,
      });
    }
    set((state: KernelsState) => ({ kernels }));
  },
  getExecutionPhase: (id: string) => {
    return get().kernels.get(id)?.executionPhase;
  },
  setExecutionPhase: (id: string, executionPhase: ExecutionPhase) => {
    const kernels = get().kernels;
    const k = kernels.get(id);
    if (k) {
      k.executionPhase = executionPhase;
    } else {
      kernels.set(id, {
        id,
        executionPhase,
      });
    }
    set((state: KernelsState) => ({ kernels }));
  },
}));

export function useKernelsStore(): KernelsState;
export function useKernelsStore<T>(selector: (state: KernelsState) => T): T;
export function useKernelsStore<T>(selector?: (state: KernelsState) => T) {
  return useStore(kernelsStore, selector!);
}

export default useKernelsStore;
