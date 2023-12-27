/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
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
import { HTMLManager } from '@jupyter-widgets/html-manager';
import { shims } from '@jupyter-widgets/base/lib/services-shim';
import * as outputWidgets from '@jupyter-widgets/jupyterlab-manager/lib/output';

// Exposing @jupyter-widgets/base and @jupyter-widgets/controls as AMD modules for custom widget bundles that depend on it.

import * as base from '@jupyter-widgets/base';
import * as controls from '@jupyter-widgets/controls';

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

  registerWithKernel(kernelConnection: Kernel.IKernelConnection | null) {
    this._kernelConnection = kernelConnection;
    if (this._commRegistration) {
      this._commRegistration.dispose();
    }
    if (kernelConnection) {
      this._commRegistration = kernelConnection.registerCommTarget(
        this.comm_target_name,
        (comm: Kernel.IComm, message: KernelMessage.ICommOpenMsg) => {
          this.handle_comm_open(new shims.services.Comm(comm), message);
        }
      );
    }
  }

  get onError() {
    return this._onError;
  }

  display_view(
    view: Promise<DOMWidgetView> | DOMWidgetView,
    el: HTMLElement
  ): Promise<void> {
    return Promise.resolve(view).then(view => {
      Widget.attach(view.luminoWidget, el);
      view.on('remove', function () {
        console.log('view removed', view);
      });
      //      return view;
    });
  }

  loadClass(
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

  callbacks(view: WidgetView): ICallbacks {
    const baseCallbacks = super.callbacks(view);
    return Object.assign({}, baseCallbacks, {
      iopub: { output: (msg: any) => this._onError.emit(msg) },
    });
  }

  _create_comm(
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

  _get_comm_info(): Promise<{}> {
    return this._kernelConnection!.requestCommInfo({
      target_name: this.comm_target_name,
    }).then((reply: any) => reply.content.comms);
  }
}

export default IPyWidgetsClassicManager;
