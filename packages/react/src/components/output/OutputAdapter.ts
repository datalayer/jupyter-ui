/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { IOutput } from '@jupyterlab/nbformat';
import {
  IOutputAreaModel,
  OutputArea,
  OutputAreaModel,
} from '@jupyterlab/outputarea';
import {
  IRenderMime,
  RenderMimeRegistry,
  standardRendererFactories,
} from '@jupyterlab/rendermime';
import { rendererFactory as jsonRendererFactory } from '@jupyterlab/json-extension';
import { rendererFactory as javascriptRendererFactory } from '@jupyterlab/javascript-extension';
import {
  WIDGET_MIMETYPE,
  WidgetRenderer,
} from '@jupyter-widgets/html-manager/lib/output_renderers';
import { requireLoader as loader } from '../../jupyter/ipywidgets/libembed-amd';
import { ClassicWidgetManager } from '../../jupyter/ipywidgets/classic/manager';
import Kernel from '../../jupyter/kernel/Kernel';

export class OutputAdapter {
  private _kernel?: Kernel;
  private _renderers: IRenderMime.IRendererFactory[];
  private _outputArea: OutputArea;
  private _rendermime: RenderMimeRegistry;
  private _iPyWidgetsClassicManager: ClassicWidgetManager;

  public constructor(
    kernel?: Kernel,
    outputs?: IOutput[],
    outputAreaModel?: IOutputAreaModel
  ) {
    this._kernel = kernel;
    this._renderers = standardRendererFactories.filter(
      factory => factory.mimeTypes[0] !== 'text/javascript'
    );
    this._renderers.push(jsonRendererFactory);
    this._renderers.push(javascriptRendererFactory);
    this._rendermime = new RenderMimeRegistry({
      initialFactories: this._renderers,
    });
    this._iPyWidgetsClassicManager = new ClassicWidgetManager({
      loader,
    });
    this._rendermime.addFactory(
      {
        safe: false,
        mimeTypes: [WIDGET_MIMETYPE],
        createRenderer: (options: any) =>
          new WidgetRenderer(options, this._iPyWidgetsClassicManager),
      },
      0
    );
    //    const widgetRegistry = activateWidgetExtension(this._rendermime);
    //    activatePlotlyWidgetExtension(widgetRegistry);
    const model =
      outputAreaModel ??
      new OutputAreaModel({
        trusted: true,
        values: outputs,
      });
    this._outputArea = new OutputArea({
      model,
      rendermime: this._rendermime,
    });
    if (outputs && outputs[0]) {
      const data = outputs[0].data as any;
      if (data) {
        const isPlotly = data['application/vnd.plotly.v1+json'];
        if (isPlotly) {
          let script =
            this._outputArea.node.children[0].children[1].children[0]
              .children[1].innerHTML;
          script = script.replaceAll('\n,', '\n');
          eval(script);
        }
      }
    }
    this.initKernel();
  }

  public async execute(code: string) {
    if (this._kernel) {
      this.clear();
      await this._kernel?.execute(code, { model: this._outputArea.model })
        ?.done;
    }
  }

  public interrupt() {
    if (this._kernel) {
      this._kernel.interrupt();
    }
  }

  public clear() {
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
      this._iPyWidgetsClassicManager.registerWithKernel(
        this._kernel.connection
      );
    }
  }
}

export default OutputAdapter;
