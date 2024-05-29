/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

export namespace OutputState {
  export type ISource = {
    sourceId: string;
    source: string;
    increment?: number;
  };
  export type IDataset = {
    sourceId: string;
    dataset: any;
    increment?: number;
  };
  export type IExecute = {
    sourceId: string;
    source: string;
    increment?: number;
  };
  export type IGrade = {
    sourceId: string;
    success: boolean;
    increment?: number;
  };
}

export type IOutputState = {
  source?: OutputState.ISource;
  dataset?: OutputState.IDataset;
  setSource?: OutputState.ISource;
  execute?: OutputState.IExecute;
  grade?: OutputState.IGrade;
};

export interface IOutputsState {
  outputs: Map<string, IOutputState>;
}

export type OutputState = IOutputsState & {
  setOutputs: (outputs: Map<string, IOutputState>) => void;
  selectJupyterSource: (id: string) => OutputState.ISource | undefined;
  selectJupyterSetSource: (id: string) => OutputState.ISource | undefined;
  selectDataset: (id: string) => OutputState.IDataset | undefined;
  selectExecute: (id: string) => OutputState.IExecute | undefined;
  selectGrade: (id: string) => OutputState.IGrade | undefined;
  source: (source: OutputState.ISource) => void;
  dataset: (dataset: OutputState.IDataset) => void;
  execute: (execute: OutputState.IExecute) => void;
  setSource: (source: OutputState.ISource) => void;
  grade: (grade: OutputState.IGrade) => void;
};

export const outputStore = createStore<OutputState>((set, get) => ({
  outputs: new Map<string, IOutputState>(),
  setOutputs: (outputs: Map<string, IOutputState>) => set((state: OutputState) => ({ outputs })),
  selectJupyterSource: (id: string): OutputState.ISource | undefined => {
    return get().outputs.get(id)?.source;
  },
  selectJupyterSetSource: (id: string): OutputState.ISource | undefined => {
    return get().outputs.get(id)?.setSource;
  },
  selectDataset: (id: string): OutputState.IDataset | undefined => {
    return get().outputs.get(id)?.dataset;
  },
  selectExecute: (id: string): OutputState.IExecute | undefined => {
    return get().outputs.get(id)?.execute;
  },
  selectGrade: (id: string): OutputState.IGrade | undefined => {
    return get().outputs.get(id)?.grade;
  },
  source: (source: OutputState.ISource) => {
    const sourceId = source.sourceId;
    const outputs = get().outputs;
    const s = outputs.get(sourceId);
    if (s) {
      s.source = source;
    } else {
      outputs.set(sourceId, { source });
    }
    set((state: OutputState) => ({ outputs }))
  },
  dataset: (dataset: OutputState.IDataset) => {
    const sourceId = dataset.sourceId;
    const outputs = get().outputs;
    const d = outputs.get(sourceId);
    if (d) {
      d.dataset = dataset;
    } else {
      outputs.set(sourceId, { dataset });
    }
    set((state: OutputState) => ({ outputs }))
  },
  execute: (execute: OutputState.IExecute) => {
    const sourceId = execute.sourceId;
    const outputs = get().outputs;
    const e = outputs.get(sourceId);
    if (e) {
      e.execute = execute;
    } else {
      outputs.set(sourceId, { execute });
    }
    set((state: OutputState) => ({ outputs }))
  },
  setSource: (setSource: OutputState.ISource) => {
    const sourceId = setSource.sourceId;
    const outputs = get().outputs;
    const s = outputs.get(sourceId);
    if (s) {
      s.setSource = setSource;
    } else {
      outputs.set(sourceId, { setSource });
    }
    set((state: OutputState) => ({ outputs }))
  },
  grade: (grade: OutputState.IGrade) => {
    const sourceId = grade.sourceId;
    const outputs = get().outputs;
    const g = outputs.get(sourceId);
    if (g) {
      g.grade = grade;
    } else {
      outputs.set(sourceId, { grade });
    }
    set((state: OutputState) => ({ outputs }))
  },
}));

export function useOutputStore(): OutputState;
export function useOutputStore<T>(selector: (state: OutputState) => T): T;
export function useOutputStore<T>(selector?: (state: OutputState) => T) {
  return useStore(outputStore, selector!);
}

export default useOutputStore;
