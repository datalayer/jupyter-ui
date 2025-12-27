/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { ServiceManager } from '@jupyterlab/services';
import { createLiteServer, Lite } from '../lite';

export const createLiteServiceManager = (
  lite: Lite = true
): Promise<ServiceManager.IManager> => {
  const liteServiceManager = createLiteServer().then(async liteServer => {
    // Load the browser kernel.
    const mod =
      typeof lite === 'boolean'
        ? //        ? await import('../../jupyterlite/pyodide-kernel-extension/index')
          await import('@jupyterlite/pyodide-kernel-extension')
        : await lite;
    // Load the module manually to get the list of plugin IDs.
    let data = mod.default;
    // Handle commonjs exports.
    if (!Object.prototype.hasOwnProperty.call(mod, '__esModule')) {
      data = mod as any;
    }
    if (!Array.isArray(data)) {
      data = [data];
    }
    const pluginIDs = data.map(item => {
      try {
        liteServer.registerPlugin(item);
        return item.id;
      } catch (error) {
        console.error(error);
        return null;
      }
    });
    // Activate the loaded plugins.
    await Promise.all(
      pluginIDs.filter(id => id).map(id => liteServer.activatePlugin(id!))
    );
    const liteServiceManager = liteServer.serviceManager;
    (liteServiceManager as any)['__NAME__'] = 'LiteServiceManager';
    console.log('Lite Service Manager is created', liteServiceManager);
    return liteServiceManager;
  });
  return liteServiceManager;
};
