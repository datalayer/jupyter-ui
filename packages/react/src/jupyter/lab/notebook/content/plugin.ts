import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { NotebookPanel } from '@jupyterlab/notebook';
import { IEditorServices } from '@jupyterlab/codeeditor';
import CountdownContentFactory from './CountdownContentFactory';

/**
 * The notebook cell factory provider.
 */
const contentFactoryPlugin: JupyterFrontEndPlugin<NotebookPanel.IContentFactory> = {
  id: '@datalayer/jupyter-react:notebook-content-factory',
  description: 'Provides the notebook cell factory.',
  provides: NotebookPanel.IContentFactory,
  requires: [IEditorServices],
  autoStart: true,
  activate: (app: JupyterFrontEnd, editorServices: IEditorServices) => {
    const editorFactory = editorServices.factoryService.newInlineEditor;
    return new CountdownContentFactory({ editorFactory });
  }
}

export default contentFactoryPlugin;
