/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { ReactWidget } from '@jupyterlab/apputils';

import MockComponent from './component/MockComponent';

export class DatalayerWidget extends ReactWidget {
  constructor() {
    super();
    this.addClass('dla-Container');
  }

  render(): JSX.Element {
    return <MockComponent/>;
  }
}
