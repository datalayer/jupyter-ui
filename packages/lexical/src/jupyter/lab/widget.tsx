/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { ReactWidget } from '@jupyterlab/apputils';
import MockComponent from './components/MockComponent';

export class DatalayerWidget extends ReactWidget {
  constructor() {
    super();
    this.addClass('dla-Container');
  }

  render(): JSX.Element {
    return <MockComponent/>;
  }

}
