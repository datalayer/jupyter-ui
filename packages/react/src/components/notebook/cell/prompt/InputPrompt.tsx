import { useState, useEffect, useRef } from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { IInputPrompt } from '@jupyterlab/cells';

/**
 * The class name added to InputPrompt.
 */
const INPUT_PROMPT_CLASS = 'jp-InputPrompt';

const Countdown = (props: {count: number}) => {
  const [count, setCount] = useState(props.count);
  let intervalRef = useRef<number>();
  const decreaseNum = () => setCount((prev) => prev - 1);
  useEffect( () => {
      setCount(props.count);
  }, [props.count])
  useEffect(() => {
    intervalRef.current = setInterval(decreaseNum, 1000) as any;
    return () => clearInterval(intervalRef.current);
  }, []);
    return (
      <>
        {count}
      </>
    );
}

/**
 * The custom input prompt implementation.
 */
export class InputPrompt extends ReactWidget implements IInputPrompt {
  private _executionCount: string | null = null;

  private state = {
    count: 100
  }

  /*
  * Create an output prompt widget.
  */
  constructor() {
    super();
    this.addClass(INPUT_PROMPT_CLASS);
  }

  /** @override */
  render() {
    return <Countdown count={this.state.count} />
  }

  /**
   * The execution count for the prompt.
   */
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

export default InputPrompt;
