import React from 'react';
import { IFrame, ToolbarButton, ReactWidget, IWidgetTracker } from '@jupyterlab/apputils';
import { ABCWidgetFactory, DocumentRegistry, DocumentWidget } from '@jupyterlab/docregistry';
import { INotebookModel } from '@jupyterlab/notebook';
import { Token } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';

export type INotebookRenderTracker = IWidgetTracker<ClassicRender>

export const INotebookRenderTracker = new Token<INotebookRenderTracker>(
  '@datalayer/juptyer-react:IClassicRenderTracker'
);

export const CLASSIC_RENDER_ICON_CLASS = 'jp-MaterialIcon jp-NotebookIcon';

export class ClassicRender extends DocumentWidget<IFrame, INotebookModel> {
  private _renderOnSave: boolean;

  constructor(options: ClassicRender.IOptions) {
    super({
      ...options,
      content: new IFrame({ sandbox: ['allow-same-origin', 'allow-scripts'] })
    });
    const { getPreviewUrl, context, renderOnSave } = options;
    window.onmessage = (event: any) => {
      //console.log("EVENT: ", event);
      switch (event.data?.level) {
        case 'debug':
          console.debug(...event.data?.msg);
          break;
        case 'info':
          console.info(...event.data?.msg);
          break;
        case 'warn':
          console.warn(...event.data?.msg);
          break;
        case 'error':
          console.error(...event.data?.msg);
          break;
        default:
          console.log(event);
          break;
      }
    };
    this.content.url = getPreviewUrl(context.path);
    this.content.title.iconClass = CLASSIC_RENDER_ICON_CLASS;
    this.renderOnSave = renderOnSave ? true : false;
    context.pathChanged.connect(() => {
      this.content.url = getPreviewUrl(context.path);
    });
    const reloadButton = new ToolbarButton({
      iconClass: 'jp-RefreshIcon',
      tooltip: 'Reload Preview',
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

export namespace ClassicRender {
  export interface IOptions extends DocumentWidget.IOptionsOptionalContent<IFrame, INotebookModel> {
    getPreviewUrl: (path: string) => string;
    renderOnSave?: boolean;
  }
}

export class ClassicRenderFactory extends ABCWidgetFactory<ClassicRender, INotebookModel> {
  private getPreviewUrl: (path: string) => string
  public defaultRenderOnSave = false;

  constructor(getPreviewUrl: (path: string) => string, options: DocumentRegistry.IWidgetFactoryOptions<ClassicRender>) {
    super(options);
    this.getPreviewUrl = getPreviewUrl;
  }

  protected createNewWidget(context: DocumentRegistry.IContext<INotebookModel>): ClassicRender {
    return new ClassicRender({
      context,
      getPreviewUrl: this.getPreviewUrl,
      renderOnSave: this.defaultRenderOnSave
    });
  }

}
