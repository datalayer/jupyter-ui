import { INotebookContent } from '@jupyterlab/nbformat';
import { INotebookModel, NotebookModelFactory, NotebookModel } from "@jupyterlab/notebook";
import { DocumentRegistry } from '@jupyterlab/docregistry';
import type { ISharedNotebook } from '@jupyter/ydoc';

export class JupyterReactNotebookModelFactory extends NotebookModelFactory {
  private _nbformat?: INotebookContent;
  private _readOnly: boolean;

  /** @override */
  constructor(options: DatalayerNotebookModelFactory.IOptions) {
    super(options);
    this._nbformat = options.nbformat;
    this._readOnly = options.readOnly;
  }

  /** @override */
  createNew(
    options: DocumentRegistry.IModelOptions<ISharedNotebook>
  ): INotebookModel {
    if (this._nbformat) {
      const notebookModel = new NotebookModel();
      notebookModel.fromJSON(this._nbformat);
      return notebookModel;
    } else {
      const notebookModel = super.createNew(options);
      notebookModel.readOnly = this._readOnly;
      return notebookModel;  
    }
  }
}

export declare namespace DatalayerNotebookModelFactory {
  interface IOptions extends NotebookModelFactory.IOptions {
    nbformat?: INotebookContent;
    readOnly: boolean;
  }
}

export default JupyterReactNotebookModelFactory;
