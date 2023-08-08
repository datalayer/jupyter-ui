import { ReactWidget } from '@jupyterlab/apputils';
import { IOutputPrompt } from '@jupyterlab/outputarea';
import { ExecutionCount } from '@jupyterlab/nbformat';
import { Countdown } from './Countdown';

const OUTPUT_PROMPT_CLASS = 'jp-OutputPrompt';

export class CountdownOutputPrompt extends ReactWidget implements IOutputPrompt {
  private _executionCount: ExecutionCount = null;

  private state = {
    count: 100
  }

  constructor() {
    super();
    this.addClass(OUTPUT_PROMPT_CLASS);
  }

  /** @override */
  render() {
    return <Countdown count={this.state.count} />
  }

  get executionCount(): ExecutionCount {
    return this._executionCount;
  }

  set executionCount(value: ExecutionCount) {
    this._executionCount = value;
    if (value === null) {
      this.state = {
        count: 0
      };
    } else {
      this.state = {
        count: Number(value)
      };
      this.update();
    }
  }

}

export default CountdownOutputPrompt;
