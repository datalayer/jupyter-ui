/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { ReactPortal } from 'react';
import { INotebookModel } from '@jupyterlab/notebook';
import { NotebookChange } from '@jupyter/ydoc';
import { Cell, ICellModel } from '@jupyterlab/cells';
import { Kernel as JupyterKernel } from '@jupyterlab/services';
import NotebookAdapter from './NotebookAdapter';

export type PortalDisplay = {
  portal: ReactPortal;
  pinned: boolean;
};

export type INotebookState = {
  model?: INotebookModel;
  adapter?: NotebookAdapter;
  saveRequest?: Date;
  activeCell?: Cell<ICellModel>;
  kernelStatus?: JupyterKernel.Status;
  notebookChange?: NotebookChange;
  portals: ReactPortal[];
  portalDisplay?: PortalDisplay;
};

/* State */

export interface INotebooksState {
  notebooks: Map<string, INotebookState>;
}
