/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { DocumentRegistry } from "@jupyterlab/docregistry";
import { INotebookModel, NotebookPanel } from "@jupyterlab/notebook";
import { CommandRegistry } from '@lumino/commands';
import { NotebookAdapter } from './NotebookAdapter';

export type IDatalayerNotebookExtensionProps = {
  notebookId: string;
  commands: CommandRegistry;
  panel: NotebookPanel;
  adapter?: NotebookAdapter;
};

export type DatalayerNotebookExtension = DocumentRegistry.IWidgetExtension<NotebookPanel,INotebookModel> & {
  init(props: IDatalayerNotebookExtensionProps): void;
  get component(): JSX.Element | null;
};
