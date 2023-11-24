import { create } from 'zustand';

export type CellZustandState = {
  id: number;
}

export const useCellStore = create<CellZustandState>((set, get) => ({
  id: 0,
}));

export default useCellStore;
