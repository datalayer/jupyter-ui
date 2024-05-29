/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import ConsoleAdapter from './ConsoleAdapter';

export type IConsole = number;

export interface IConsoleState {
  outputs: IConsole;
  adapter?: ConsoleAdapter;
}

export type ConsoleState = IConsoleState & {
  execute: (dark: boolean) => void;
  setOutputs: (outputs: number) => void;
  setAdapter: (adapter?: ConsoleAdapter) => void;
};

export const consoleStore = createStore<ConsoleState>((set, get) => ({
  outputs: 0,
  adapter: undefined,
  execute: () => {},
  setOutputs: (outputs: number) => set((state: ConsoleState) => ({ outputs })),
  setAdapter: (adapter?: ConsoleAdapter) => set((state: ConsoleState) => ({ adapter })),
}));

export function useConsoleStore(): ConsoleState;
export function useConsoleStore<T>(selector: (state: ConsoleState) => T): T;
export function useConsoleStore<T>(selector?: (state: ConsoleState) => T) {
  return useStore(consoleStore, selector!);
}

export default useConsoleStore;
