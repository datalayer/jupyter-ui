/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */
import { ServiceManager } from '@jupyterlab/services';
import { Lite } from '../lite';
import { createLiteServer } from '../lite/LiteServer';

export const createServiceManagerLite = (lite: Lite = true): Promise<ServiceManager.IManager> => {
  return createLiteServer().then(async liteServer => {
    // Load the browser kernel.
    const mod =
        typeof lite === 'boolean'
        ? await import('@jupyterlite/pyodide-kernel-extension')
        : await lite;
    // Load the module manually to get the list of plugin IDs
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
    return liteServer.serviceManager;
  });
}
