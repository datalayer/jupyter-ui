import { ToolbarButton, ReactWidget } from '@jupyterlab/apputils';
import { ABCWidgetFactory, DocumentRegistry, DocumentWidget } from '@jupyterlab/docregistry';
import { INotebookModel } from '@jupyterlab/notebook';
import { Signal } from '@lumino/signaling';
import ViewerWidget from './ViewerWidget';

export const VIEWER_ICON_CLASS = 'jp-MaterialIcon jp-NotebookIcon';

export class Viewer extends DocumentWidget<ViewerWidget, INotebookModel> {
  private _renderOnSave: boolean = false;

  constructor(options: Viewer.IOptions) {
    super({
      ...options,
      content: new ViewerWidget(options.context),
    });
    const { context, renderOnSave } = options;
    this.content.title.iconClass = VIEWER_ICON_CLASS;
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

export namespace Viewer {
  export interface IOptions extends DocumentWidget.IOptionsOptionalContent<ViewerWidget, INotebookModel> {
    renderOnSave?: boolean;
  }
}

export class ViewerFactory extends ABCWidgetFactory<Viewer, INotebookModel> {
  public defaultRenderOnSave = false;

  constructor(options: DocumentRegistry.IWidgetFactoryOptions<Viewer>) {
    super(options);
  }

  protected createNewWidget(context: DocumentRegistry.IContext<INotebookModel>): Viewer {
    return new Viewer({
      context,
      renderOnSave: this.defaultRenderOnSave
    });
  }

}
