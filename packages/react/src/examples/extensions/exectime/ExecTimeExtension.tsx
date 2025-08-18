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
import { ExecTimeWidget } from './ExecTimeWidget';

import './ExecTimeExtension.css';

export class ExecTimeExtension implements NotebookExtension {
  /* @override */
  init(props: INotebookExtensionProps) {}

  /* @override */
  createNew(
    notebookPanel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ) {
    new ExecTimeWidget(notebookPanel);
  }

  /* @override */
  get component(): JSX.Element | null {
    return null;
  }
}

export default ExecTimeExtension;
