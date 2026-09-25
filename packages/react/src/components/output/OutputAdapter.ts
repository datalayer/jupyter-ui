/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { rendererFactory as javascriptRendererFactory } from '@jupyterlab/javascript-extension';
import { rendererFactory as jsonRendererFactory } from '@jupyterlab/json-extension';
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
import { JSONObject } from '@lumino/coreutils';
import {
  ClassicWidgetManager,
  WidgetRenderer,
  WIDGET_MIMETYPE,
} from '../../jupyter/ipywidgets/classic';
import { requireLoader as loader } from '../../jupyter/ipywidgets/libembed-amd';
import { IExecutionPhaseOutput, Kernel } from '../../jupyter/kernel';
import { execute } from './OutputExecutor';
import { MarimoReactive } from '../../jupyter/marimo/reactive';
import { DEFAULT_VARIANT, type JupyterVariant } from '../../jupyter/variant';

export class OutputAdapter {
  private _id: string;
  private _kernel?: Kernel;
  private _renderers: IRenderMime.IRendererFactory[];
  private _outputArea: OutputArea;
  private _rendermime: RenderMimeRegistry;
  private _iPyWidgetsManager: ClassicWidgetManager;
  private _suppressCodeExecutionErrors: boolean;
  private _variant?: JupyterVariant;
  private _lastCode = '';

  public constructor(
    id: string,
    kernel?: Kernel,
    outputs?: IOutput[],
    outputAreaModel?: IOutputAreaModel,
    suppressCodeExecutionErrors: boolean = false,
    variant?: JupyterVariant
  ) {
    this._id = id;
    this._kernel = kernel;
    this._variant = variant;
    this._suppressCodeExecutionErrors = suppressCodeExecutionErrors;
    this._renderers = standardRendererFactories.filter(
      factory => factory.mimeTypes[0] !== 'text/javascript'
    );
    this._renderers.push(jsonRendererFactory);
    this._renderers.push(javascriptRendererFactory);
    this._rendermime = new RenderMimeRegistry({
      initialFactories: this._renderers,
    });
    this._iPyWidgetsManager = new ClassicWidgetManager({ loader });
    this._rendermime.addFactory(
      {
        safe: false,
        mimeTypes: [WIDGET_MIMETYPE],
        createRenderer: (options: any) =>
          new WidgetRenderer(options, this._iPyWidgetsManager),
      },
      0
    );
    // const widgetRegistry = activateWidgetExtension(this._rendermime);
    // activatePlotlyWidgetExtension(widgetRegistry);
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

  /**
   * The semantics this output runs with: its own, else its kernel's.
   */
  get variant(): JupyterVariant {
    return this._variant ?? this._kernel?.variant ?? DEFAULT_VARIANT;
  }

  /**
   * Run the code, and — on a marimo kernel — what depends on it.
   *
   * The output registers its code in the kernel's reactive graph under its
   * own id, so other cells on the kernel re-run it when they change what it
   * reads, and runs the cells that read what it defines. `react: false` is
   * how the graph runs this output as one of those: the cell alone.
   */
  public async execute(
    code: string,
    onExecutionPhaseChanged?: (phaseOutput: IExecutionPhaseOutput) => void,
    { react = true }: { react?: boolean } = {}
  ) {
    if (this._kernel) {
      this._lastCode = code;
      const reactive = this.reactive();
      if (reactive) {
        reactive.bindRunner(this._id, () =>
          this.execute(this._lastCode, onExecutionPhaseChanged, {
            react: false,
          })
        );
        const registration = await reactive.register(this._id, code);
        if (registration.error) {
          // Not runnable: the kernel will say so with the same error.
          reactive.unbindRunner(this._id);
        }
      }
      this.clear();
      const metadata: JSONObject = {};
      await this._iPyWidgetsManager.ready.promise;
      if (this._kernel) {
        this._iPyWidgetsManager.registerWithKernel(this._kernel.connection);
        const done = execute(
          this._id,
          code,
          this._outputArea,
          this._kernel,
          metadata,
          this._suppressCodeExecutionErrors,
          onExecutionPhaseChanged
        );
        const reply = await done;
        if (
          reactive &&
          react &&
          !reactive.reacting &&
          reply?.content.status === 'ok'
        ) {
          await reactive.react(this._id);
        }
      }
    }
  }

  private reactive(): MarimoReactive | undefined {
    const connection = this._kernel?.connection;
    return this.variant === 'marimo' && connection
      ? MarimoReactive.for(connection)
      : undefined;
  }

  public interrupt() {
    if (this._kernel) {
      this._kernel.interrupt();
    }
  }

  public clear() {
    this._outputArea.model.clear();
  }

  public setOutputs(outputs: IOutput[]) {
    this._outputArea.model.clear();
    outputs.forEach(output => {
      this._outputArea.model.add(output);
    });
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

  private async initKernel() {
    await this._iPyWidgetsManager.ready.promise;
    if (this._kernel) {
      this._iPyWidgetsManager.registerWithKernel(this._kernel.connection);
    }
  }
}

export default OutputAdapter;
