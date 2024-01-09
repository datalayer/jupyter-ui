/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { create } from 'zustand';

export type OutputZustandState = {
  id: number;
};

export const useOutputStore = create<OutputZustandState>((set, get) => ({
  id: 0,
}));

export default useOutputStore;
