/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { ReactWidget } from '@jupyterlab/apputils';
import { CodeCell } from '@jupyterlab/cells';
import { IDatalayerNotebookExtensionProps } from '../../../components';
import { CellToolbarComponent } from './CellToolbarComponent';

export class CellToolbar extends ReactWidget {
  private _cell: CodeCell;
  private _props: IDatalayerNotebookExtensionProps;

  constructor(cell: CodeCell, props: IDatalayerNotebookExtensionProps) {
    super();
    this._cell = cell;
    this._props = props;
    this.addClass('dla-Container');
  }

  render(): JSX.Element {
    return (
      <>
        <CellToolbarComponent cell={this._cell} extensionProps={this._props} />
      </>
    )
  }

}
