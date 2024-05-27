/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { IDatalayerConfig } from './IState';
import useCellStore from '../../components/cell/CellZustand';

export type JupyterReactState = {
  tab: number;
  getIntTab: () => number;
  setTab: (tab: number) => void;
  configuration?: IDatalayerConfig;
  setConfiguration: (configuration?: IDatalayerConfig) => void;
  version: string;
  setVersion: (version: string) => void;
  cellStore: typeof useCellStore;
};

let initialConfiguration: IDatalayerConfig | undefined = undefined;

try {
  const rawConfig = document.getElementById('datalayer-config-data');
  if (rawConfig?.innerText) {
    initialConfiguration = JSON.parse(rawConfig?.innerText);
  }
} catch (error) {
  console.debug('No configuration found in the webpage.', error);
}

export const jupyterReactStore = createStore<JupyterReactState>((set, get) => ({
  tab: 0.0,
  getIntTab: () => Math.floor(get().tab),
  setTab: (tab: number) => set((state: JupyterReactState) => ({ tab })),
  configuration: initialConfiguration,
  setConfiguration: (configuration?: IDatalayerConfig) => {
    set(state => ({ configuration }));
  },
  version: '',
  setVersion: version => {
    if (version && !get().version) {
      set(state => ({ version }));
    }
  },
  cellStore: useCellStore,
}));

export function useJupyterReactStore(): JupyterReactState;
export function useJupyterReactStore<T>(selector: (state: JupyterReactState) => T): T;
export function useJupyterReactStore<T>(selector?: (state: JupyterReactState) => T) {
  return useStore(jupyterReactStore, selector!);
}

export default useJupyterReactStore;
