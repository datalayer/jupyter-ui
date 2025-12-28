/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { ServiceManager } from '@jupyterlab/services';
import { createLiteServer, Lite } from '../lite';
import type { JupyterLiteServerPlugin } from '../lite/server/app';

export const createLiteServiceManager = (
  lite: Lite = true
): Promise<ServiceManager.IManager> => {
  const liteServiceManager = createLiteServer().then(async liteServer => {
    // Load the browser kernel.
    const mod =
      typeof lite === 'boolean'
        ? await import('../lite/pyodide-kernel-extension/index')
        : await lite;
    // Load the module manually to get the list of plugin IDs.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: JupyterLiteServerPlugin<any>[] = mod.default;
    // Handle commonjs exports.
    if (!Object.prototype.hasOwnProperty.call(mod, '__esModule')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data = mod as any;
    }
    // Vite wraps modules in a Module object with a default getter.
    // If we got another Module object, unwrap it.
    if (data && typeof data === 'object' && 'default' in data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data = (data as any).default;
    }
    if (!Array.isArray(data)) {
      data = [data];
    }
    const pluginIDs = data.map(item => {
      try {
        liteServer.registerPlugin(item);
        return item.id;
      } catch (error) {
        console.error('Error registering pyodide plugin', error);
        return null;
      }
    });
    // Activate the loaded plugins.
    await Promise.all(
      pluginIDs
        .filter((id): id is string => id !== null)
        .map(id => liteServer.activatePlugin(id))
    );
    const liteServiceManager = liteServer.serviceManager;
    (liteServiceManager as { __NAME__?: string })['__NAME__'] =
      'LiteServiceManager';
    return liteServiceManager;
  });
  return liteServiceManager;
};
