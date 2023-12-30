/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { Widget } from '@lumino/widgets';
import { Kernel, KernelMessage } from '@jupyterlab/services';
import {
  WidgetModel,
  WidgetView,
  DOMWidgetView,
  ICallbacks,
} from '@jupyter-widgets/base';
import { shims } from '@jupyter-widgets/base/lib/services-shim';
import { requireLoader, HTMLManager } from '@jupyter-widgets/html-manager';
import {
  BundledIPyWidgets,
  ExternalIPyWidgets,
} from '../../../components/notebook/Notebook';

import * as outputWidgets from '@jupyter-widgets/jupyterlab-manager/lib/output';
import * as base from '@jupyter-widgets/base';
import * as controls from '@jupyter-widgets/controls';

// Exposing @jupyter-widgets/base and @jupyter-widgets/controls as AMD modules for custom widget bundles that depend on it.

if (
  typeof window !== 'undefined' &&
  typeof (window as any).define !== 'undefined'
) {
  (window as any).define('@jupyter-widgets/base', base);
  (window as any).define('@jupyter-widgets/controls', controls);
}

/**
 * The class is responsible for the classic IPyWidget rendering.
 */
export class IPyWidgetsClassicManager extends HTMLManager {
  public _kernelConnection: Kernel.IKernelConnection | null;
  private _commRegistration: any;
  private _onError: any;

  public registerWithKernel(kernelConnection: Kernel.IKernelConnection | null) {
    this._kernelConnection = kernelConnection;
    if (this._commRegistration) {
      this._commRegistration.dispose();
    }
    if (kernelConnection) {
      this._commRegistration = kernelConnection.registerCommTarget(
        this.comm_target_name,
        (comm: Kernel.IComm, commOpenMessage: KernelMessage.ICommOpenMsg) => {
          this.handle_comm_open(new shims.services.Comm(comm), commOpenMessage);
        }
      );
    }
  }

  get onError() {
    return this._onError;
  }

  public display_view(
    view: Promise<DOMWidgetView> | DOMWidgetView,
    el: HTMLElement
  ): Promise<void> {
    return Promise.resolve(view).then(view => {
      Widget.attach(view.luminoWidget, el);
      view.on('remove', function () {
        console.log('The IPyWidgets view is removed', view);
      });
      //      return view;
    });
  }

  public loadClass(
    className: string,
    moduleName: any,
    moduleVersion: string
  ): Promise<typeof WidgetModel | typeof WidgetView> {
    if (moduleName === '@jupyter-widgets/output') {
      return Promise.resolve(outputWidgets).then(module => {
        if ((module as any)[className]) {
          return (module as any)[className];
        } else {
          return Promise.reject(
            `Class ${className} not found in module ${moduleName}`
          );
        }
      });
    } else {
      return super.loadClass(className, moduleName, moduleVersion);
    }
  }

  public callbacks(view: WidgetView): ICallbacks {
    const baseCallbacks = super.callbacks(view);
    return Object.assign({}, baseCallbacks, {
      iopub: { output: (msg: any) => this._onError.emit(msg) },
    });
  }

  public _create_comm(
    target_name: any,
    model_id: string,
    data?: any,
    metadata?: any,
    buffers?: ArrayBuffer[] | ArrayBufferView[]
  ): Promise<any> {
    const comm = this._kernelConnection?.createComm(target_name, model_id);
    if (data || metadata) {
      comm?.open(data, metadata);
    }
    return Promise.resolve(new shims.services.Comm(comm!));
  }

  public _get_comm_info(): Promise<{}> {
    return this._kernelConnection!.requestCommInfo({
      target_name: this.comm_target_name,
    }).then((reply: any) => reply.content.comms);
  }

  public loadBundledIPyWidgets = (
    ipywidgets: BundledIPyWidgets[],
  ): void => {
    const loadIPyWidget = (name: string, version: string, module: any) => {
      requireLoader(name, version).then(module => {
        //
      });
    };
    ipywidgets.forEach(ipywidget => {
      loadIPyWidget(ipywidget.name, ipywidget.version, ipywidget.module);
    });
  }

  public loadExternalIPyWidgets(
    ipywidgets: ExternalIPyWidgets[],
  ): void {
    const loadIPyWidget = (name: string, version: string) => {
      requireLoader(name, version).then(module => {
        //
      });
    };
    ipywidgets.forEach(ipywidget => {
      loadIPyWidget(ipywidget.name, ipywidget.version);
    });
  };
    
}

export default IPyWidgetsClassicManager;
