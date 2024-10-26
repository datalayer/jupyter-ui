/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { INotebookContent } from '@jupyterlab/nbformat';
import { INotebookModel, NotebookModelFactory, NotebookModel } from '@jupyterlab/notebook';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import type { ISharedNotebook } from '@jupyter/ydoc';

export class JupyterReactNotebookModelFactory extends NotebookModelFactory {
  private _nbformat?: INotebookContent;
  private _readonly: boolean;

  /** @override */
  constructor(options: DatalayerNotebookModelFactory.IOptions) {
    super(options);
    this._nbformat = options.nbformat;
    this._readonly = options.readonly;
  }

  /** @override */
  createNew(options: DocumentRegistry.IModelOptions<ISharedNotebook>): INotebookModel {
    if (this._nbformat) {
      this._nbformat.cells.forEach(cell => {
        cell.metadata['editable'] = !this._readonly;
      });
      const notebookModel = new NotebookModel();
      notebookModel.fromJSON(this._nbformat);
      return notebookModel;
    } else {
      const notebookModel = super.createNew(options);
      notebookModel.readOnly = this._readonly;
      return notebookModel;
    }
  }
}

export declare namespace DatalayerNotebookModelFactory {
  interface IOptions extends NotebookModelFactory.IOptions {
    nbformat?: INotebookContent;
    readonly: boolean;
  }
}

export default JupyterReactNotebookModelFactory;
