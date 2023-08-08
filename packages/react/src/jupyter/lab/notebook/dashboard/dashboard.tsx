import { ToolbarButton, ReactWidget, IWidgetTracker } from '@jupyterlab/apputils';
import { ABCWidgetFactory, DocumentRegistry, DocumentWidget } from '@jupyterlab/docregistry';
import { INotebookModel } from '@jupyterlab/notebook';
import { Token } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';
import DashboardWidget from './dashboardWidget';

export type IDashboardTracker = IWidgetTracker<Dashboard>

export const IDashboardTracker = new Token<IDashboardTracker>(
  '@datalayer/jupyter-react:IDashboardTracker'
);

export const DASHBOARD_ICON_CLASS = 'jp-MaterialIcon jp-NotebookIcon';

export class Dashboard extends DocumentWidget<DashboardWidget, INotebookModel> {
  private _renderOnSave: boolean;

  constructor(options: Dashboard.IOptions) {
    super({
      ...options,
      content: new DashboardWidget(options.context),
    });
    const { context, renderOnSave } = options;
    this.content.title.iconClass = DASHBOARD_ICON_CLASS;
    this.renderOnSave = renderOnSave ? true : false;
    context.pathChanged.connect(() => {
//      this.content.url = getClassicUrl(context.path);
    });
    const reloadButton = new ToolbarButton({
      iconClass: 'jp-RefreshIcon',
      tooltip: 'Reload Dashboard',
      onClick: () => {
        this.reload();
      }
    });
    const renderOnSaveCheckbox = ReactWidget.create(
      <label className="jp-Preview-renderOnSave">
        <input
          style={{ verticalAlign: 'middle' }}
          name="renderOnSave"
          type="checkbox"
          defaultChecked={renderOnSave}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            this._renderOnSave = event.target.checked;
          }}
        />
        Render on Save
      </label>
    );
    this.toolbar.addItem('reload', reloadButton);
    if (context) {
      this.toolbar.addItem('renderOnSave', renderOnSaveCheckbox);
      void context.ready.then(() => {
        context.fileChanged.connect(() => {
          if (this.renderOnSave) {
            this.reload();
          }
        });
      });
    }
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    super.dispose();
    Signal.clearData(this);
  }

  reload(): void {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const iframe = this.content.node.querySelector('iframe')!;
    if (iframe.contentWindow) {
      iframe.contentWindow.location.reload();
    }
  }

  get renderOnSave(): boolean {
    return this._renderOnSave;
  }

  set renderOnSave(renderOnSave: boolean) {
    this._renderOnSave = renderOnSave;
  }

}

export namespace Dashboard {
  export interface IOptions extends DocumentWidget.IOptionsOptionalContent<DashboardWidget, INotebookModel> {
    renderOnSave?: boolean;
  }
}

export class DashboardFactory extends ABCWidgetFactory<Dashboard, INotebookModel> {
  public defaultRenderOnSave = false;

  constructor(options: DocumentRegistry.IWidgetFactoryOptions<Dashboard>) {
    super(options);
  }

  protected createNewWidget(context: DocumentRegistry.IContext<INotebookModel>): Dashboard {
    return new Dashboard({
      context,
      renderOnSave: this.defaultRenderOnSave
    });
  }

}
