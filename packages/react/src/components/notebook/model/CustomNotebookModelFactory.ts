import { INotebookModel, NotebookModelFactory } from "@jupyterlab/notebook";
import { IModelDB } from "@jupyterlab/observables";

export class CustomNotebookModelFactory extends NotebookModelFactory {

  /** @override */
  constructor(options: NotebookModelFactory.IOptions) {
    super(options);
  }

  /** @override */
  createNew(
    languagePreference?: string,
    modelDB?: IModelDB,
    isInitialized?: boolean
  ): INotebookModel {
    const model = super.createNew(languagePreference, modelDB, isInitialized);
    return model;
  }

}

export default CustomNotebookModelFactory;
