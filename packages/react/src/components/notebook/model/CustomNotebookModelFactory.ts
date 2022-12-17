import { INotebookModel, NotebookModelFactory } from "@jupyterlab/notebook";

export class CustomNotebookModelFactory extends NotebookModelFactory {

  /** @override */
  constructor(options: NotebookModelFactory.IOptions) {
    super(options);
  }

  /** @override */
  createNew(
    languagePreference?: string
  ): INotebookModel {
    const model = super.createNew(languagePreference);
    return model;
  }

}

export default CustomNotebookModelFactory;
