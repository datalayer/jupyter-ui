/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel, NotebookPanel } from '@jupyterlab/notebook';
import { CommandRegistry } from '@lumino/commands';
import { Notebook2Adapter } from './Notebook2Adapter';

export type INotebookExtensionProps = {
  notebookId: string;
  commands: CommandRegistry;
  panel: NotebookPanel;
  adapter?: Notebook2Adapter;
};

export type NotebookExtension = DocumentRegistry.IWidgetExtension<
  NotebookPanel,
  INotebookModel
> & {
  init(props: INotebookExtensionProps): void;
  get component(): JSX.Element | null;
};
