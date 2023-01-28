import { INotebookModel, NotebookModelFactory } from "@jupyterlab/notebook";
import { DocumentRegistry } from '@jupyterlab/docregistry';
import type { ISharedNotebook } from '@jupyter/ydoc';

export class CustomNotebookModelFactory extends NotebookModelFactory {

  /** @override */
  constructor(options: NotebookModelFactory.IOptions) {
    super(options);
  }

  /** @override */
  createNew(
    options: DocumentRegistry.IModelOptions<ISharedNotebook>
  ): INotebookModel {
    const model = super.createNew(options);
    return model;
  }

}

export default CustomNotebookModelFactory;
