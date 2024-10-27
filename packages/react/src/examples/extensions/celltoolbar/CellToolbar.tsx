/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { ReactWidget } from '@jupyterlab/apputils';
import { CodeCell } from '@jupyterlab/cells';
import { IDatalayerNotebookExtensionProps } from '../../../components';
import { CellToolbarComponent } from './CellToolbarComponent';

export const DATALAYER_CELL_TOOLBAR_CLASS = 'dla-CellToolbar-Container';

export class CellToolbar extends ReactWidget {
  private _cell: CodeCell;
  private _props: IDatalayerNotebookExtensionProps;

  constructor(cell: CodeCell, props: IDatalayerNotebookExtensionProps) {
    super();
    this._cell = cell;
    this._props = props;
    this.addClass(DATALAYER_CELL_TOOLBAR_CLASS);
  }

  render(): JSX.Element {
    return (
      <>
        <CellToolbarComponent cell={this._cell} extensionProps={this._props} />
      </>
    )
  }

}
