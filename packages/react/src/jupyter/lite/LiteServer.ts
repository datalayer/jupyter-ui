/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { PageConfig } from '@jupyterlab/coreutils';
import {
  JupyterLiteServer,
  JupyterLiteServerPlugin,
} from './server';
// import * as baseServerExtension from './server-extension/index';

/**
 * Iterate over active plugins in an extension.
 */
function* activePlugins(
  extension: any
): Generator<JupyterLiteServerPlugin<any>> {
  // Handle commonjs or es2015 modules.
  let exports;
  if (Object.prototype.hasOwnProperty.call(extension, '__esModule')) {
    exports = extension.default;
  } else {
    // CommonJS exports.
    exports = extension;
  }

  // Vite wraps modules in a Module object with a default getter.
  // If we got another Module object, unwrap it.
  if (exports && typeof exports === 'object' && 'default' in exports) {
    exports = exports.default;
  }

  const plugins: JupyterLiteServerPlugin<any>[] = Array.isArray(exports)
    ? exports
    : [exports];
  for (const plugin of plugins) {
    if (!plugin?.id) {
      console.log('Skipping JupyterLite plugin without id:', plugin);
      continue;
    }
    if (PageConfig.Extension.isDisabled(plugin.id)) {
      console.info(`JupyterLite plugin '${plugin.id}' has been disabled.`);
      continue;
    }
    yield plugin;
  }
}

/**
 * Create a JupyterLiteServer application with the default plugins.
 *
 * #### Notes
 * The JupyterLiteServer application is a Lumino application without
 * a shell. Its sole purpose is to create a custom ServiceManager.
 *
 * @returns A promise resolving in a jupyterlite server application
 */
export async function createLiteServer(): Promise<JupyterLiteServer> {
  PageConfig.setOption(
    'serviceWorkerUrl',
    window.location.protocol +
      '//' +
      window.location.host +
      '/service-worker.js'
  );
  const litePluginsToRegister: any[] = [];
  // Load the base jupyterlite server extensions.
  const baseServerExtension =
    await import('./server-extension/index');

  for (const plugin of activePlugins(baseServerExtension)) {
    console.log('Activating JupyterLite server plugin', plugin.id);
    litePluginsToRegister.push(plugin);
  }

  console.log('Total plugins registered:', litePluginsToRegister.length);
  // Create the in-browser JupyterLite Server.
  const jupyterLiteServer = new JupyterLiteServer({} as any);
  jupyterLiteServer.registerPluginModules(litePluginsToRegister);
  // Start the server.
  await jupyterLiteServer.start();
  return jupyterLiteServer;
}
