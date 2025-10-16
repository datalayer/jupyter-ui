/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { Widget } from '@lumino/widgets';
import { ManagerBase } from '@jupyter-widgets/base-manager';

import * as base from '@jupyter-widgets/base';
import * as controls from '@jupyter-widgets/controls';

export class IPyWidgetsViewManager extends ManagerBase {
  private el;
  constructor(el: any) {
    super();
    this.el = el;
  }
  async loadClass(
    className: string,
    moduleName: string,
    moduleVersion: string
  ) {
    return new Promise((resolve, reject) => {
      if (moduleName === '@jupyter-widgets/controls') {
        resolve(controls);
      } else if (moduleName === '@jupyter-widgets/base') {
        resolve(base);
      } else {
        const fallback = function (err: any) {
          const failedId = err.requireModules && err.requireModules[0];
          if (failedId) {
            console.log(
              `Falling back to jsDelivr for ${moduleName}@${moduleVersion}`
            );
            (window as any).require(
              [
                `https://cdn.jsdelivr.net/npm/${moduleName}@${moduleVersion}/dist/index.js`,
              ],
              resolve,
              reject
            );
          } else {
            throw err;
          }
        };
        (window as any).require([`${moduleName}.js`], resolve, fallback);
      }
    }).then((module: any) => {
      if (module[className]) {
        return module[className];
      } else {
        return Promise.reject(
          `Class ${className} not found in module ${moduleName}@${moduleVersion}`
        );
      }
    });
  }
  async display_view(view: any) {
    return Promise.resolve(view).then(view => {
      Widget.attach(view.luminoWidget, this.el);
      return view;
    });
  }
  _get_comm_info() {
    return Promise.resolve({});
  }
  _create_comm() {
    return Promise.reject('no comms available');
  }
}

export default IPyWidgetsViewManager;
