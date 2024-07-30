/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { IOutputAreaModel } from '@jupyterlab/outputarea';
import OutputAdapter from './OutputAdapter';

export namespace OutputState {
  export type IOutput = {
    id: string;
    model: IOutputAreaModel;
  };
  export type IInput = {
    id: string;
    input: string;
    increment?: number;
  };
  export type IDataset = {
    id: string;
    dataset: any;
    increment?: number;
  };
  export type IExecute = {
    id: string;
    source: string;
    increment?: number;
  };
  export type IGrade = {
    id: string;
    success: boolean;
    increment?: number;
  };
}

export type IOutputState = {
  adapter?: OutputAdapter;
  output?: OutputState.IOutput;
  source?: OutputState.IInput;
  dataset?: OutputState.IDataset;
  execute?: OutputState.IExecute;
  grade?: OutputState.IGrade;
};

export interface IOutputsState {
  outputs: Map<string, IOutputState>;
}

export type OutputState = IOutputsState & {
  getAdapter: (id: string) => OutputAdapter | undefined;
  getDataset: (id: string) => OutputState.IDataset | undefined;
  getExecute: (id: string) => OutputState.IExecute | undefined;
  getGrade: (id: string) => OutputState.IGrade | undefined;
  getOutput: (id: string) => OutputState.IOutput | undefined;
  getInput: (id: string) => OutputState.IInput | undefined;
  setAdapter: (id: string, adapter: OutputAdapter) => void;
  setDataset: (dataset: OutputState.IDataset) => void;
  setExecute: (execute: OutputState.IExecute) => void;
  setGrade: (grade: OutputState.IGrade) => void;
  setOutput: (output: OutputState.IOutput) => void;
  setOutputs: (outputs: Map<string, IOutputState>) => void;
  setInput: (source: OutputState.IInput) => void;
};

export const outputStore = createStore<OutputState>((set, get) => ({
  outputs: new Map<string, IOutputState>(),
  getAdapter: (id: string) => {
    return get().outputs.get(id)?.adapter;
  },
  getInput: (id: string): OutputState.IInput | undefined => {
    return get().outputs.get(id)?.source;
  },
  getOutput: (id: string): OutputState.IOutput | undefined => {
    return get().outputs.get(id)?.output;
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
    const sourceId = dataset.id;
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
    const sourceId = execute.id;
    const outputs = get().outputs;
    const e = outputs.get(sourceId);
    if (e) {
      e.execute = execute;
    } else {
      outputs.set(sourceId, { execute });
    }
    set((state: OutputState) => ({ outputs }))
  },
  setOutput: (outputState: OutputState.IOutput) => {
    const outputs = get().outputs;
    outputs.set(outputState.id, {
      output: {
        id: outputState.id,
        model: outputState.model,
      }
    });
    get().setOutputs(outputs);
  },
  setInput: (sourceState: OutputState.IInput) => {
    const outputs = get().outputs;
    const output = outputs.get(sourceState.id);
    if (output?.source?.input === sourceState.input) {
      return;
    }
    outputs.set(sourceState.id, {
      source: {
        id: sourceState.id,
        input: sourceState.input,
      }
    });
    get().setOutputs(outputs);
  },
  setGrade: (grade: OutputState.IGrade) => {
    const sourceId = grade.id;
    const outputs = get().outputs;
    const g = outputs.get(sourceId);
    if (g) {
      g.grade = grade;
    } else {
      outputs.set(sourceId, { grade: grade });
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
