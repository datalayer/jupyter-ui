/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import TerminalAdapter from './TerminalAdapter';
import { ITerminalState } from './TerminalState';

export type TerminalZustandState = ITerminalState & {
  setDark: (dark: boolean) => void;
  setAdapter: (adapter?: TerminalAdapter) => void;
};

export const terminalStore = createStore<TerminalZustandState>((set, get) => ({
  dark: false,
  adapter: undefined,
  setDark: (dark: boolean) => set((state: TerminalZustandState) => ({ dark })),
  setAdapter: (adapter?: TerminalAdapter) => set((state: TerminalZustandState) => ({ adapter })),
}));

export function useTerminalStore(): TerminalZustandState;
export function useTerminalStore<T>(selector: (state: TerminalZustandState) => T): T;
export function useTerminalStore<T>(selector?: (state: TerminalZustandState) => T) {
  return useStore(terminalStore, selector!);
}

export default useTerminalStore;
