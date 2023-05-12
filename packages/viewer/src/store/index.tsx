import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react";

export class Timer {
  secondsPassed = 0;
  constructor() {
    makeAutoObservable(this);
  }
  reset() {
    this.secondsPassed = 0
  }
  increaseTimer() {
    this.secondsPassed += 1;
  }
}

export const timer = new Timer();

setInterval(() => {
  timer.increaseTimer();
}, 1000);

export type ITimerViewProps = {
  timer: Timer,
}

export const TimerView = observer(({ timer }: ITimerViewProps) => (
  <button onClick={() => timer.reset()}>
    Seconds passed: {timer.secondsPassed}
  </button>
));
