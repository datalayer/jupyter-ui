import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { IDashboardTracker } from './../../editor/dashboard';
import NotebookHeaderExtension from './NotebookHeaderExtension';

export type JupyterFrontEndProps = {
  app?: JupyterFrontEnd;
}

const notebookHeaderPlugin: JupyterFrontEndPlugin<void> = {
  id: '@datalayer/jupyter-dashboard:notebook-header',
  autoStart: true,
  requires: [IDashboardTracker],
  optional: [],
  activate: (
    app: JupyterFrontEnd,
    dashboardTracker: IDashboardTracker,
  ) => {
    app.docRegistry.addWidgetExtension(
      'Notebook',
      new NotebookHeaderExtension(app, dashboardTracker)
    );
  }
};

export default notebookHeaderPlugin;
