import { IOutput } from '@jupyterlab/nbformat';
import { OutputArea, OutputAreaModel } from '@jupyterlab/outputarea';
import { IRenderMime, RenderMimeRegistry, standardRendererFactories } from '@jupyterlab/rendermime';
import { rendererFactory as jsonRendererFactory } from '@jupyterlab/json-extension';
import { rendererFactory as javascriptRendererFactory } from '@jupyterlab/javascript-extension';

export class OutputAdapter {
  private _renderers: IRenderMime.IRendererFactory[];
  private _outputArea: OutputArea;
  private _rendermime: RenderMimeRegistry;

  public constructor(adaptPlotly: boolean, outputs?: IOutput[]) {
    this._renderers = standardRendererFactories.filter(factory => factory.mimeTypes[0] !== 'text/javascript');
    this._renderers.push(jsonRendererFactory);
    this._renderers.push(javascriptRendererFactory);
    this._rendermime = new RenderMimeRegistry({
      initialFactories: this._renderers,
    });
    const outputAreaModel = new OutputAreaModel({
      trusted: true,
      values: outputs,
    })
    this._outputArea = new OutputArea({
      model: outputAreaModel,
      rendermime: this._rendermime,
    });
    if (adaptPlotly && outputs && outputs[0]) {
      const data = outputs[0].data as any;
      const isPlotly = data['application/vnd.plotly.v1+json'];
      if (isPlotly) {
        let script = this._outputArea.node.children[0].children[1].children[0].children[1].innerHTML;
        script = script.replaceAll('\n,', '\n');
        eval(script);
      }
    }
  }

  public clearOutput() {
    this._outputArea.model.clear();
  }

  get outputArea(): OutputArea {
    return this._outputArea;
  }

}

export default OutputAdapter;
