/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { ReactWidget } from '@jupyterlab/apputils';
import { CodeCell } from '@jupyterlab/cells';

export class CellToolbar extends ReactWidget {
  private _cell: CodeCell;
  constructor(cell: CodeCell) {
    super();
    this._cell = cell;
    this.addClass('dla-Container');
  }

  render(): JSX.Element {
    return <>id: {this._cell.model.id}</>
  }
}
