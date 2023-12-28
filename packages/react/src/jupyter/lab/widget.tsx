/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/apputils';
import JupyterReact from '../../app/JupyterReact';

export class JupyterReactWidget extends ReactWidget {
  private _app: JupyterFrontEnd;

  constructor(app: JupyterFrontEnd) {
    super();
    this._app = app;
    this.addClass('dla-Container');
  }

  render(): JSX.Element {
    return <JupyterReact app={this._app} />;
  }
}
