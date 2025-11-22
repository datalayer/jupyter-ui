/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { INotebookContent } from '@jupyterlab/nbformat';
import {
  INotebookModel,
  NotebookModelFactory,
  NotebookModel,
} from '@jupyterlab/notebook';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import type { ISharedNotebook } from '@jupyter/ydoc';

/**
 * Custom notebook model factory for Jupyter React.
 */
export class JupyterReactNotebookModelFactory extends NotebookModelFactory {
  private _nbformat?: INotebookContent;
  private _readonly: boolean;

  /**
   * Construct a new Jupyter React notebook model factory.
   * @param options - The model factory options
   */
  constructor(options: DatalayerNotebookModelFactory.IOptions) {
    super(options);
    this._nbformat = options.nbformat;
    this._readonly = options.readonly;
  }

  /** @inheritDoc */
  override get disableDocumentWideUndoRedo(): boolean {
    return super.disableDocumentWideUndoRedo;
  }

  /** @inheritDoc */
  override set disableDocumentWideUndoRedo(value: boolean) {
    super.disableDocumentWideUndoRedo = value;
  }

  /** @override */
  createNew(
    options: DocumentRegistry.IModelOptions<ISharedNotebook>
  ): INotebookModel {
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

/**
 * Namespace for Datalayer notebook model factory.
 */
export declare namespace DatalayerNotebookModelFactory {
  /**
   * Options for creating a Datalayer notebook model factory.
   */
  interface IOptions extends NotebookModelFactory.IOptions {
    /**
     * Initial notebook content in nbformat.
     */
    nbformat?: INotebookContent;
    /**
     * Whether the notebook should be readonly.
     */
    readonly: boolean;
    /**
     * Defines if the document can be undo/redo.
     * @alpha
     */
    disableDocumentWideUndoRedo?: boolean;
  }
}

export default JupyterReactNotebookModelFactory;
