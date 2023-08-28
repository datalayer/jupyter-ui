import { IDisposable, DisposableDelegate } from '@lumino/disposable';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import { IDashboardTracker } from './../../editor/dashboard';
import NotebookHeaderWidget from './NotebookHeaderWidget';

export class NotebookHeaderExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  private _app: JupyterFrontEnd;
  private _dashboardTracker: IDashboardTracker;

  constructor(app: JupyterFrontEnd, dashboardTracker: IDashboardTracker) {
    this._app = app;
    this._dashboardTracker = dashboardTracker;
  }

  createNew(panel: NotebookPanel, _: DocumentRegistry.IContext<INotebookModel>): IDisposable {
    const notebookHeader = new NotebookHeaderWidget(this._app, this._dashboardTracker, panel);
    notebookHeader.addClass('datalayer-NotebookPanel-header');
    panel.contentHeader.insertWidget(0, notebookHeader);
    return new DisposableDelegate(() => {
      notebookHeader.dispose();
    });
  }

}

export default NotebookHeaderExtension;
