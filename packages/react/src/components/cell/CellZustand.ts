/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { create } from 'zustand';

export type CellZustandState = {
  id: number;
}

export const useCellStore = create<CellZustandState>((set, get) => ({
  id: 0,
}));

export default useCellStore;
