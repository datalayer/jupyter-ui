import { create } from 'zustand';

export class Timer {
  _secondsPassed = 0;
  constructor() {
  }
  reset() {
    this._secondsPassed = 0
  }
  increaseTimer() {
    this._secondsPassed += 1;
  }
  get secondsPassed() {
    return this._secondsPassed;
  }
}

export type ZustandState = {
  tab: number;
  getIntTab: () => number;
  setTab: (tab: number) => void,
  timer: Timer;
  increaseTimer: () => void,
  secondsPassed: number,
}

export const useStore = create<ZustandState>((set, get) => ({
  tab: 0.0,
  getIntTab: () => Math.floor(get().tab),
  setTab: (tab: number) => set((state) => ({ tab })),
  timer: new Timer(),
  increaseTimer: () => {
    get().timer.increaseTimer();
    set((state) => ({ secondsPassed: get().timer.secondsPassed }));
  },
  secondsPassed: 0,
}));

export default useStore;
