/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { create } from 'zustand';

export type CellZustandState = {
  id: number;
};

export const useCellStore = create<CellZustandState>((set, get) => ({
  id: 0,
}));

export default useCellStore;
