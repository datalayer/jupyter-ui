/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { INotebookModel, NotebookPanel } from '@jupyterlab/notebook';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import {
  NotebookExtension,
  INotebookExtensionProps,
} from '../../../components';
import { CellToolbarWidget } from './CellToolbarWidget';

import './CellToolbarExtension.css';

export class CellToolbarExtension implements NotebookExtension {
  private _props?: INotebookExtensionProps;

  /* @override */
  init(props: INotebookExtensionProps) {
    this._props = props;
  }

  /* @override */
  createNew(
    notebookPanel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ) {
    new CellToolbarWidget(notebookPanel, this._props!);
  }

  /* @override */
  get component(): JSX.Element | null {
    return null;
  }
}

export default CellToolbarExtension;
