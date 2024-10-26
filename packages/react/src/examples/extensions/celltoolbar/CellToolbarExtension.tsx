/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { INotebookModel, NotebookPanel } from '@jupyterlab/notebook';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { DatalayerNotebookExtension  } from '../../../components';
import { CellToolbarWidget } from './CellToolbarWidget';

import './CellToolbarExtension.css';

export class CellToolbarExtension implements DatalayerNotebookExtension {
  constructor() {}

  /* @override */
  createNew(notebookPanel: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>) {
    new CellToolbarWidget(notebookPanel);
  }

  /* @override */
  get component(): JSX.Element | undefined {
    return <>Hello</>
  }

}

export default CellToolbarExtension;
