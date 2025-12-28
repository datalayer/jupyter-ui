// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

/**
 * A WebWorker entrypoint that uses comlink to handle postMessage details
 */

import { expose } from 'comlink';

import {
  ContentsAPI,
  DriveFS,
  ServiceWorkerContentsAPI,
} from '@jupyterlite/contents';

import { IPyodideWorkerKernel } from './tokens';

import { PyodideRemoteKernel } from './worker';

/**
 * A custom drive implementation which uses the service worker
 */
class PyodideDriveFS extends DriveFS {
  createAPI(options: DriveFS.IOptions): ContentsAPI {
    return new ServiceWorkerContentsAPI(
      options.baseUrl,
      options.driveName,
      options.mountpoint,
      options.FS,
      options.ERRNO_CODES
    );
  }
}

export class PyodideComlinkKernel extends PyodideRemoteKernel {
  constructor() {
    super();
    this._sendWorkerMessage = (msg: any) => {
      // use postMessage, but in a format, that comlink would not process.
      postMessage({ _kernelMessage: msg });
    };
  }

  /**
   * Setup custom Emscripten FileSystem
   */
  protected async initFilesystem(
    options: IPyodideWorkerKernel.IOptions
  ): Promise<void> {
    if (options.mountDrive) {
      const mountpoint = '/drive';
      const { FS, PATH, ERRNO_CODES } = this._pyodide;
      const { baseUrl } = options;

      const driveFS = new PyodideDriveFS({
        FS: FS as any,
        PATH,
        ERRNO_CODES,
        baseUrl,
        driveName: this._driveName,
        mountpoint,
      });
      FS.mkdirTree(mountpoint);
      FS.mount(driveFS, {}, mountpoint);
      FS.chdir(mountpoint);
      this._driveFS = driveFS;
    }
  }
}

const worker = new PyodideComlinkKernel();

expose(worker);
