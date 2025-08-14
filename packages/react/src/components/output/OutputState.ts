/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { IOutputAreaModel } from '@jupyterlab/outputarea';
import { OutputAdapter } from './OutputAdapter';

export type IOutputState = {
  adapter?: OutputAdapter;
  model?: IOutputAreaModel;
  input?: string;
  dataset?: any;
  code?: string;
  gradeSuccess?: boolean;
};

export interface IOutputsState {
  outputs: Map<string, IOutputState>;
}

export type OutputState = IOutputsState & {
  getAdapter: (id: string) => OutputAdapter | undefined;
  getDataset: (id: string) => any | undefined;
  getExecuteRequest: (id: string) => string | undefined;
  getGradeSuccess: (id: string) => boolean | undefined;
  getInput: (id: string) => string | undefined;
  getModel: (id: string) => IOutputAreaModel | undefined;
  setAdapter: (id: string, adapter: OutputAdapter) => void;
  setDataset: (id: string, dataset: any) => void;
  setExecuteRequest: (id: string, code: string) => void;
  setGradeSuccess: (id: string, gradeSuccess: boolean) => void;
  setInput: (id: string, source: string) => void;
  setModel: (id: string, output: IOutputAreaModel) => void;
  setOutputs: (id: string, outputs: Map<string, IOutputState>) => void;
};

export const outputsStore = createStore<OutputState>((set, get) => ({
  outputs: new Map<string, IOutputState>(),
  getAdapter: (id: string) => {
    return get().outputs.get(id)?.adapter;
  },
  getInput: (id: string): string | undefined => {
    return get().outputs.get(id)?.input;
  },
  getModel: (id: string): IOutputAreaModel | undefined => {
    return get().outputs.get(id)?.model;
  },
  getDataset: (id: string): any | undefined => {
    return get().outputs.get(id)?.dataset;
  },
  getExecuteRequest: (id: string): string | undefined => {
    return get().outputs.get(id)?.code;
  },
  getGradeSuccess: (id: string): boolean | undefined => {
    return get().outputs.get(id)?.gradeSuccess;
  },
  setOutputs: (id: string, outputs: Map<string, IOutputState>) =>
    set((state: OutputState) => ({ outputs })),
  setAdapter: (id: string, adapter: OutputAdapter) => {
    const outputs = get().outputs;
    const d = outputs.get(id);
    if (d) {
      d.adapter = adapter;
    } else {
      outputs.set(id, { adapter });
    }
    set((state: OutputState) => ({ outputs }));
  },
  setDataset: (id: string, dataset: string) => {
    const outputs = get().outputs;
    const d = outputs.get(id);
    if (d) {
      d.dataset = dataset;
    } else {
      outputs.set(id, { dataset });
    }
    set((state: OutputState) => ({ outputs }));
  },
  setExecuteRequest: (id: string, code: string) => {
    const outputs = get().outputs;
    const e = outputs.get(id);
    if (e) {
      e.code = code;
    } else {
      outputs.set(id, { code });
    }
    set((state: OutputState) => ({ outputs }));
  },
  setModel: (id: string, model: IOutputAreaModel) => {
    const outputs = get().outputs;
    const e = outputs.get(id);
    if (e) {
      e.model = model;
    } else {
      outputs.set(id, { model });
    }
    set((state: OutputState) => ({ outputs }));
  },
  setInput: (id: string, input: string) => {
    const outputs = get().outputs;
    const e = outputs.get(id);
    if (e) {
      e.input = input;
    } else {
      outputs.set(id, { input });
    }
    set((state: OutputState) => ({ outputs }));
  },
  setGradeSuccess: (id: string, gradeSuccess: boolean) => {
    const outputs = get().outputs;
    const e = outputs.get(id);
    if (e) {
      e.gradeSuccess = gradeSuccess;
    } else {
      outputs.set(id, { gradeSuccess });
    }
    set((state: OutputState) => ({ outputs }));
  },
}));

export function useOutputsStore(): OutputState;
export function useOutputsStore<T>(selector: (state: OutputState) => T): T;
export function useOutputsStore<T>(selector?: (state: OutputState) => T) {
  return useStore(outputsStore, selector!);
}

export default useOutputsStore;
