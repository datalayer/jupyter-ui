import { NotebookPanel } from '@jupyterlab/notebook';
import { Cell, IInputPrompt } from '@jupyterlab/cells';
import { IOutputPrompt } from '@jupyterlab/outputarea';
import CountdownInputPrompt from '../../../../components/notebook/cell/prompt/CountdownInputPrompt';
import CountdownOutputPrompt from '../../../../components/notebook/cell/prompt/CountdownOutputPrompt';

export class CountdownContentFactory extends NotebookPanel.ContentFactory {
  constructor(options: Cell.ContentFactory.IOptions) {
    super(options);
  }

  /** @override */
  createInputPrompt(): IInputPrompt {
    return new CountdownInputPrompt();
  }

  /** @override */
  createOutputPrompt(): IOutputPrompt {
    return new CountdownOutputPrompt();
  }

}

export default CountdownContentFactory;
