import { OutputArea, OutputAreaModel } from '@jupyterlab/outputarea';
import { IRenderMime, RenderMimeRegistry, standardRendererFactories } from '@jupyterlab/rendermime';
import { rendererFactory as jsonRendererFactory } from '@jupyterlab/json-extension';
import { Kernel } from '@jupyterlab/services';
import { IPyWidgetsClassicManager } from "../../ipywidgets/IPyWidgetsClassicManager";
import { requireLoader } from "@jupyter-widgets/html-manager";
import { WIDGET_MIMETYPE, WidgetRenderer } from "@jupyter-widgets/html-manager/lib/output_renderers";
import { activateWidgetExtension } from "../../ipywidgets/IPyWidgetsJupyterLabPlugin";
import { activatePlotlyWidgetExtension } from "../../ipywidgets/plotly/jupyterlab-plugin";

import '@lumino/default-theme/style/index.css';
import '@jupyterlab/json-extension/style/index.css';

import './OutputAdapter.css';

class OutputAdapter {
  private _kernelConnectionPromise: Promise<Kernel.IKernelConnection> | null;
  private _renderers: IRenderMime.IRendererFactory[];
  private _outputArea: OutputArea;
  private _eventName: string;
  private _msgLoading: string;
  private _rendermime: RenderMimeRegistry;
  private _iPyWidgetsClassicManager: IPyWidgetsClassicManager;

  public constructor(
    kernel: Promise<Kernel.IKernelConnection>, 
    model: OutputAreaModel,
    options: any = {}
  ) {
    this._kernelConnectionPromise = kernel;
    this._eventName = options.eventName || 'dla-jupyter-output';
    this._msgLoading = options.msgLoading || 'Loading...';
    this._iPyWidgetsClassicManager = new IPyWidgetsClassicManager({ loader: requireLoader });
    this._renderers = standardRendererFactories.filter(_ => true);
    this._renderers.push(jsonRendererFactory);
    this._rendermime = new RenderMimeRegistry({
      initialFactories: this._renderers,
    });
    this._rendermime.addFactory(
      {
        safe: false,
        mimeTypes: [WIDGET_MIMETYPE],
        createRenderer: (options) => new WidgetRenderer(options, this._iPyWidgetsClassicManager),
      },
      0
    );
    const widgetRegistry = activateWidgetExtension(this._rendermime, null, null, null);
    activatePlotlyWidgetExtension(widgetRegistry);
    if (this._kernelConnectionPromise) {
      this._kernelConnectionPromise.then((kernelConnection: Kernel.IKernelConnection) => {
        this._iPyWidgetsClassicManager.registerWithKernel(kernelConnection)
      });
    }
    if (!options.noAutoInit) {
      this.renderCell(model);
    }
  }

  private renderCell(model: OutputAreaModel) {
    this._outputArea = new OutputArea({
      model: model,
      rendermime: this._rendermime,
    });
  }

  public execute(code: string) {
    this.event('executing', code);
    if (this._kernelConnectionPromise) {
      this._outputArea.model.clear();
      this.render(code);
      return;
    }
  }

  public clearOutput() {
    this._outputArea.model.clear();
  }

  private render(code: string) {
    this._kernelConnectionPromise!.then((kernelConnection: Kernel.IKernelConnection) => {
      this._outputArea.future = kernelConnection.requestExecute({code})
    });
    this._outputArea.model.add({
      output_type: 'stream',
      name: 'loading',
      text: this._msgLoading,
    });
    this._outputArea.model.clear(true);
  }

  private event(status: string, data: any) {
    const ev = new CustomEvent(this._eventName, {detail: {status, data}});
    document.dispatchEvent(ev);
  }

  get panel(): OutputArea {
    return this._outputArea;
  }

}

export default OutputAdapter;
