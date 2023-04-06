import { JupyterLiteServer } from '@datalayer/jupyterlite-server';
import { PageConfig } from '@jupyterlab/coreutils';
import { ServiceManager } from '@jupyterlab/services';

const serverExtensions = [
//  import('@jupyterlite/javascript-kernel-extension'),
  import('@datalayer/jupyterlite-ipykernel-extension'),
  import('@datalayer/jupyterlite-server-extension')
];

// custom list of disabled plugins.
const disabled = [
  '@jupyterlab/apputils-extension:workspaces',
  '@jupyterlab/application-extension:logo',
  '@jupyterlab/application-extension:main',
  '@jupyterlab/application-extension:tree-resolver',
  '@jupyterlab/apputils-extension:resolver',
  '@jupyterlab/docmanager-extension:download',
  '@jupyterlab/filebrowser-extension:download',
  '@jupyterlab/filebrowser-extension:share-file',
  '@jupyterlab/help-extension:about',
/*
  '@jupyterlite/server-extension:contents',
  '@jupyterlite/server-extension:contents-routes',
  '@jupyterlite/server-extension:emscripten-filesystem',
  '@jupyterlite/server-extension:licenses',
  '@jupyterlite/server-extension:licenses-routes',
  '@jupyterlite/server-extension:localforage-memory-storage',
  '@jupyterlite/server-extension:localforage',
  '@jupyterlite/server-extension:nbconvert-routes',
  '@jupyterlite/server-extension:service-worker',
  '@jupyterlite/server-extension:settings',
  '@jupyterlite/server-extension:settings-routes',
  '@jupyterlite/server-extension:translation',
  '@jupyterlite/server-extension:translation-routes',
*/
];

export async function startLiteServer(): Promise<ServiceManager> {
  const litePluginsToRegister: any[] = [];
  /**
   * Iterate over active plugins in an extension.
   */
  function* activePlugins(extension: any) {
    // Handle commonjs or es2015 modules.
    let exports;
    if (extension.hasOwnProperty('__esModule')) {
      exports = extension.default;
    } else {
      // CommonJS exports.
      exports = extension;
    }
    let plugins = Array.isArray(exports) ? exports : [exports];
    for (let plugin of plugins) {
      if (
        PageConfig.Extension.isDisabled(plugin.id) ||
        disabled.includes(plugin.id) ||
        disabled.includes(plugin.id.split(':')[0])
      ) {
        continue;
      }
      yield plugin;
    }
  }
  // Add the base serverlite extensions.
  const baseServerExtensions = await Promise.all(serverExtensions);
  baseServerExtensions.forEach(p => {
    for (let plugin of activePlugins(p)) {
      litePluginsToRegister.push(plugin);
    }
  });
  // Create the in-browser JupyterLite Server.
  const jupyterLiteServer = new JupyterLiteServer({} as any);
  jupyterLiteServer.registerPluginModules(litePluginsToRegister);
  // Start the server.
  await jupyterLiteServer.start();
  // Retrieve the custom service manager from the server app.
  const { serviceManager } = jupyterLiteServer;
  return serviceManager;
}
