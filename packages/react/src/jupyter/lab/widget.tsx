import { ReactWidget } from '@jupyterlab/apputils';
import JupyterReact from '../../app/JupyterReact';

export class JupyterReactWidget extends ReactWidget {
  constructor() {
    super();
    this.addClass('dla-Container');
  }

  render(): JSX.Element {
    return <JupyterReact />;
  }
}
