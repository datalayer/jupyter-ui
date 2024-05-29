/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import TerminalAdapter from './TerminalAdapter';

export type ITerminal = boolean;

export interface ITerminalState {
  dark: ITerminal;
  adapter?: TerminalAdapter;
}

export type TerminalState = ITerminalState & {
  setDark: (dark: boolean) => void;
  setAdapter: (adapter?: TerminalAdapter) => void;
};

export const terminalStore = createStore<TerminalState>((set, get) => ({
  dark: false,
  adapter: undefined,
  setDark: (dark: boolean) => set((state: TerminalState) => ({ dark })),
  setAdapter: (adapter?: TerminalAdapter) => set((state: TerminalState) => ({ adapter })),
}));

export function useTerminalStore(): TerminalState;
export function useTerminalStore<T>(selector: (state: TerminalState) => T): T;
export function useTerminalStore<T>(selector?: (state: TerminalState) => T) {
  return useStore(terminalStore, selector!);
}

export default useTerminalStore;
