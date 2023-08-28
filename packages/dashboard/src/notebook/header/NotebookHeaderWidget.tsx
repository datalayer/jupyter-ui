import { JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/apputils';
import { NotebookPanel } from '@jupyterlab/notebook';
import { IDashboardTracker } from './../../editor/dashboard';
import NotebookHeader from './NotebookHeader';

class NotebookHeaderWidget extends ReactWidget {
  private _app: JupyterFrontEnd;
  private _dashboardTracker: IDashboardTracker;
  private _notebookPanel: NotebookPanel

  constructor(app: JupyterFrontEnd, dashboardTracker: IDashboardTracker, notebookPanel: NotebookPanel) {
    super();
    this._app = app;
    this._dashboardTracker = dashboardTracker;
    this._notebookPanel = notebookPanel;
  }

  render() {
    return (
      <NotebookHeader
        app={this._app}
        dashboardTracker={this._dashboardTracker}
        notebookPanel={this._notebookPanel}
      />
    );
  }

}

export default NotebookHeaderWidget;
