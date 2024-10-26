/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { INotebookModel, NotebookPanel } from '@jupyterlab/notebook';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { DatalayerNotebookExtension  } from '../../../components';
import { CellToolbarWidget } from './CellToolbarWidget';
import { ICellToolbarProps } from './CellToolbar';

import './CellToolbarExtension.css';

export class CellToolbarExtension implements DatalayerNotebookExtension {
  private _props: ICellToolbarProps;
  constructor(props: ICellToolbarProps) {
    this._props= props;
  }

  /* @override */
  createNew(notebookPanel: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>) {
    new CellToolbarWidget(notebookPanel);
  }

  /* @override */
  get component(): JSX.Element | undefined {
    return <></>
  }

}

export default CellToolbarExtension;
