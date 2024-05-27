/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import ConsoleAdapter from './ConsoleAdapter';
import { IConsoleState } from './ConsoleState';

export type ConsoleZustandState = IConsoleState & {
  execute: (dark: boolean) => void;
  setOutputs: (outputs: number) => void;
  setAdapter: (adapter?: ConsoleAdapter) => void;
};

export const consoleStore = createStore<ConsoleZustandState>((set, get) => ({
  outputs: 0,
  adapter: undefined,
  execute: () => {},
  setOutputs: (outputs: number) => set((state: ConsoleZustandState) => ({ outputs })),
  setAdapter: (adapter?: ConsoleAdapter) => set((state: ConsoleZustandState) => ({ adapter })),
}));

export function useConsoleStore(): ConsoleZustandState;
export function useConsoleStore<T>(selector: (state: ConsoleZustandState) => T): T;
export function useConsoleStore<T>(selector?: (state: ConsoleZustandState) => T) {
  return useStore(consoleStore, selector!);
}

export default useConsoleStore;
