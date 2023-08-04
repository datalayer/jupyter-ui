import { INotebookContent } from '@jupyterlab/nbformat';
import { INotebookModel, NotebookModelFactory, NotebookModel } from "@jupyterlab/notebook";
import { DocumentRegistry } from '@jupyterlab/docregistry';
import type { ISharedNotebook } from '@jupyter/ydoc';

export class JupyterReactNotebookModelFactory extends NotebookModelFactory {
  private _nbformat?: INotebookContent;

  /** @override */
  constructor(options: DatalayerNotebookModelFactory.IOptions) {
    super(options);
    this._nbformat = options.nbformat;
  }

  /** @override */
  createNew(
    options: DocumentRegistry.IModelOptions<ISharedNotebook>
  ): INotebookModel {
    if (this._nbformat) {
      const model = new NotebookModel();
      model.fromJSON(this._nbformat);
      return model;
    }
    return super.createNew(options);
  }
}

export declare namespace DatalayerNotebookModelFactory {
  interface IOptions extends NotebookModelFactory.IOptions {
    nbformat?: INotebookContent;
  }
}

export default JupyterReactNotebookModelFactory;
