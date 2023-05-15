import { IOutput } from '@jupyterlab/nbformat';
import { OutputArea, OutputAreaModel } from '@jupyterlab/outputarea';
import { IRenderMime, RenderMimeRegistry, standardRendererFactories } from '@jupyterlab/rendermime';
import { rendererFactory as jsonRendererFactory } from '@jupyterlab/json-extension';
import { rendererFactory as javascriptRendererFactory } from '@jupyterlab/javascript-extension';
import { requireLoader } from "@jupyter-widgets/html-manager";
import { WIDGET_MIMETYPE, WidgetRenderer } from "@jupyter-widgets/html-manager/lib/output_renderers";
import { IPyWidgetsClassicManager } from "../../jupyter/ipywidgets/IPyWidgetsClassicManager";
import Kernel from "./../../jupyter/services/kernel/Kernel";
// import { activateWidgetExtension } from "./../../jupyter/ipywidgets/IPyWidgetsJupyterLabPlugin";
// import { activatePlotlyWidgetExtension } from "./../../jupyter/ipywidgets/plotly/JupyterlabPlugin";

export class OutputAdapter {
  private _kernel?: Kernel;
  private _renderers: IRenderMime.IRendererFactory[];
  private _outputArea: OutputArea;
  private _rendermime: RenderMimeRegistry;
  private _iPyWidgetsClassicManager: IPyWidgetsClassicManager;

  public constructor(kernel: Kernel | undefined, outputs?: IOutput[]) {
    this._kernel = kernel;
    this._renderers = standardRendererFactories.filter(factory => factory.mimeTypes[0] !== 'text/javascript');
    this._renderers.push(jsonRendererFactory);
    this._renderers.push(javascriptRendererFactory);
    this._rendermime = new RenderMimeRegistry({
      initialFactories: this._renderers,
    });
    this._iPyWidgetsClassicManager = new IPyWidgetsClassicManager({ loader: requireLoader });
    this._rendermime.addFactory({
      safe: false,
      mimeTypes: [WIDGET_MIMETYPE],
      createRenderer: (options: any) => new WidgetRenderer(options, this._iPyWidgetsClassicManager),
    }, 0);
//    const widgetRegistry = activateWidgetExtension(this._rendermime, null, null, null);
//    activatePlotlyWidgetExtension(widgetRegistry);
    const outputAreaModel = new OutputAreaModel({
      trusted: true,
      values: outputs,
    })
    this._outputArea = new OutputArea({
      model: outputAreaModel,
      rendermime: this._rendermime,
    });
    this.initKernel();
  }

  public execute(code: string) {
    if (this._kernel) {
      this.clearOutput();
      this._kernel.connection.then((kernelConnection) => {
        this._outputArea.future = kernelConnection.requestExecute({code})
      });
    }
  }

  public interrupt() {
    if (this._kernel) {
      this._kernel.connection.then((kernelConnection) => {
        kernelConnection.interrupt();
      });  
    }
  }

  public clearOutput() {
    this._outputArea.model.clear();
  }

  get kernel(): Kernel | undefined {
    return this._kernel;
  }

  set kernel(kernel: Kernel | undefined) {
    this._kernel = kernel;
    this.initKernel();
  }

  get outputArea(): OutputArea {
    return this._outputArea;
  }

  private initKernel() {
    if (this._kernel) {
      this._kernel.connection.then((kernelConnection) => {
        this._iPyWidgetsClassicManager.registerWithKernel(kernelConnection)
      });
    }
  }

}

export default OutputAdapter;
