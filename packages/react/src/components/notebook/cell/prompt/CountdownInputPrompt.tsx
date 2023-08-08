import { ReactWidget } from '@jupyterlab/apputils';
import { IInputPrompt } from '@jupyterlab/cells';
import { Countdown } from './Countdown';

const INPUT_PROMPT_CLASS = 'jp-InputPrompt';

export class CountdownInputPrompt extends ReactWidget implements IInputPrompt {
  private _executionCount: string | null = null;

  private state = {
    count: 100
  }

  constructor() {
    super();
    this.addClass(INPUT_PROMPT_CLASS);
  }

  /** @override */
  render() {
    return <Countdown count={this.state.count} />
  }

  get executionCount(): string | null {
    return this._executionCount;
  }

  set executionCount(value: string | null) {
    this._executionCount = value;
    if (value === null) {
      this.state = {
        count: 0
      };
    } else {
      if (value === '*') {
        this.state = {
          count: 0
        };
      }
      else {
        this.state = {
          count: Number(value)
        };
        this.update();
      }
    }
  }

}

export default CountdownInputPrompt;
