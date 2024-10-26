/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { INotebookModel, NotebookPanel } from '@jupyterlab/notebook';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { ExecuteTimeWidget } from './ExecuteTimeWidget';

import './ExecTime.css';

export class ExecuteTimeWidgetExtension implements DocumentRegistry.WidgetExtension {
  constructor() {
  }
  createNew(notebookPanel: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>) {
    return new ExecuteTimeWidget(notebookPanel);
  }
}

export default ExecuteTimeWidgetExtension;
