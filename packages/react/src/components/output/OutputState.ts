/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import OutputAdapter from './OutputAdapter';

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
  adapter?: OutputAdapter;
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
  setAdapter: (id: string, adapter: OutputAdapter) => void;
  setDataset: (dataset: OutputState.IDataset) => void;
  setExecute: (execute: OutputState.IExecute) => void;
  setSource: (source: OutputState.ISource) => void;
  setGrade: (grade: OutputState.IGrade) => void;
  getAdapter: (id: string) => OutputAdapter | undefined;
  getSource: (id: string) => OutputState.ISource | undefined;
  getDataset: (id: string) => OutputState.IDataset | undefined;
  getExecute: (id: string) => OutputState.IExecute | undefined;
  getGrade: (id: string) => OutputState.IGrade | undefined;
};

export const outputStore = createStore<OutputState>((set, get) => ({
  outputs: new Map<string, IOutputState>(),
  setOutputs: (outputs: Map<string, IOutputState>) => set((state: OutputState) => ({ outputs })),
  setAdapter: (id: string, adapter: OutputAdapter) => {
    const outputs = get().outputs;
    const d = outputs.get(id);
    if (d) {
      d.adapter = adapter;
    } else {
      outputs.set(id, { adapter });
    }
    set((state: OutputState) => ({ outputs }))
  },
  setDataset: (dataset: OutputState.IDataset) => {
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
  setExecute: (execute: OutputState.IExecute) => {
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
  setGrade: (grade: OutputState.IGrade) => {
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
  getAdapter: (id: string) => {
    return get().outputs.get(id)?.adapter;
  },
  getSource: (id: string): OutputState.ISource | undefined => {
    return get().outputs.get(id)?.source;
  },
  getDataset: (id: string): OutputState.IDataset | undefined => {
    return get().outputs.get(id)?.dataset;
  },
  getExecute: (id: string): OutputState.IExecute | undefined => {
    return get().outputs.get(id)?.execute;
  },
  getGrade: (id: string): OutputState.IGrade | undefined => {
    return get().outputs.get(id)?.grade;
  },
}));

export function useOutputStore(): OutputState;
export function useOutputStore<T>(selector: (state: OutputState) => T): T;
export function useOutputStore<T>(selector?: (state: OutputState) => T) {
  return useStore(outputStore, selector!);
}

export default useOutputStore;
