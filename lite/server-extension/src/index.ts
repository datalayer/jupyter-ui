// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { PageConfig } from '@jupyterlab/coreutils';

import { KernelSpec } from '@jupyterlab/services';

import { IKernels, Kernels, IKernelSpecs, KernelSpecs } from '@datalayer/jupyterlite-kernel';

import {
  JupyterLiteServer,
  JupyterLiteServerPlugin,
  Router,
  IServiceWorkerRegistrationWrapper,
  ServiceWorkerRegistrationWrapper,
} from '@datalayer/jupyterlite-server';

import { ISessions, Sessions } from '@datalayer/jupyterlite-session';

import { ISettings, Settings } from '@datalayer/jupyterlite-settings';

import localforage from 'localforage';


/**
 * A plugin installing the service worker.
 */
const serviceWorkerPlugin: JupyterLiteServerPlugin<IServiceWorkerRegistrationWrapper> =
  {
    id: '@datalayer/jupyterlite-server-extension:service-worker',
    autoStart: true,
    provides: IServiceWorkerRegistrationWrapper,
    activate: (app: JupyterLiteServer) => {
      return new ServiceWorkerRegistrationWrapper();
    },
  };

/**
 * The kernels service plugin.
 */
const kernelsPlugin: JupyterLiteServerPlugin<IKernels> = {
  id: '@datalayer/jupyterlite-server-extension:kernels',
  autoStart: true,
  provides: IKernels,
  requires: [IKernelSpecs],
  activate: (app: JupyterLiteServer, kernelspecs: IKernelSpecs) => {
    return new Kernels({ kernelspecs });
  },
};

/**
 * A plugin providing the routes for the kernels service
 */
const kernelsRoutesPlugin: JupyterLiteServerPlugin<void> = {
  id: '@datalayer/jupyterlite-server-extension:kernels-routes',
  autoStart: true,
  requires: [IKernels],
  activate: (app: JupyterLiteServer, kernels: IKernels) => {
    // POST /api/kernels/{kernel_id} - Restart a kernel
    app.router.post(
      '/api/kernels/(.*)/restart',
      async (req: Router.IRequest, kernelId: string) => {
        const res = await kernels.restart(kernelId);
        return new Response(JSON.stringify(res));
      }
    );

    // DELETE /api/kernels/{kernel_id} - Kill a kernel and delete the kernel id
    app.router.delete(
      '/api/kernels/(.*)',
      async (req: Router.IRequest, kernelId: string) => {
        const res = await kernels.shutdown(kernelId);
        return new Response(JSON.stringify(res), { status: 204 });
      }
    );
  },
};

/**
 * The kernel spec service plugin.
 */
const kernelSpecPlugin: JupyterLiteServerPlugin<IKernelSpecs> = {
  id: '@datalayer/jupyterlite-server-extension:kernelspec',
  autoStart: true,
  provides: IKernelSpecs,
  activate: (app: JupyterLiteServer) => {
    return new KernelSpecs();
  },
};

/**
 * A plugin providing the routes for the kernelspec service.
 */
const kernelSpecRoutesPlugin: JupyterLiteServerPlugin<void> = {
  id: '@datalayer/jupyterlite-server-extension:kernelspec-routes',
  autoStart: true,
  requires: [IKernelSpecs],
  activate: (app: JupyterLiteServer, kernelspecs: IKernelSpecs) => {
    app.router.get('/api/kernelspecs', async (req: Router.IRequest) => {
      const { specs } = kernelspecs;
      if (!specs) {
        return new Response(null);
      }
      // follow the same format as in Jupyter Server
      const allKernelSpecs: {
        [name: string]: {
          name: string;
          spec: KernelSpec.ISpecModel | undefined;
          resources: { [name: string]: string } | undefined;
        };
      } = {};
      const allSpecs = specs.kernelspecs;
      Object.keys(allSpecs).forEach((name) => {
        const spec = allSpecs[name];
        const { resources } = spec ?? {};
        allKernelSpecs[name] = {
          name,
          spec,
          resources,
        };
      });
      const res = {
        default: specs.default,
        kernelspecs: allKernelSpecs,
      };
      return new Response(JSON.stringify(res));
    });
  },
};

/**
 * A plugin providing the routes for the nbconvert service.
 * TODO: provide the service in a separate plugin?
 */
const nbconvertRoutesPlugin: JupyterLiteServerPlugin<void> = {
  id: '@datalayer/jupyterlite-server-extension:nbconvert-routes',
  autoStart: true,
  activate: (app: JupyterLiteServer) => {
    app.router.get('/api/nbconvert', async (req: Router.IRequest) => {
      return new Response(JSON.stringify({}));
    });
  },
};

/**
 * The sessions service plugin.
 */
const sessionsPlugin: JupyterLiteServerPlugin<ISessions> = {
  id: '@datalayer/jupyterlite-server-extension:sessions',
  autoStart: true,
  provides: ISessions,
  requires: [IKernels],
  activate: (app: JupyterLiteServer, kernels: IKernels) => {
    return new Sessions({ kernels });
  },
};

/**
 * A plugin providing the routes for the session service.
 */
const sessionsRoutesPlugin: JupyterLiteServerPlugin<void> = {
  id: '@datalayer/jupyterlite-server-extension:sessions-routes',
  autoStart: true,
  requires: [ISessions],
  activate: (app: JupyterLiteServer, sessions: ISessions) => {
    // GET /api/sessions/{session} - Get session
    app.router.get('/api/sessions/(.+)', async (req: Router.IRequest, id: string) => {
      const session = await sessions.get(id);
      return new Response(JSON.stringify(session), { status: 200 });
    });

    // GET /api/sessions - List available sessions
    app.router.get('/api/sessions', async (req: Router.IRequest) => {
      const list = await sessions.list();
      return new Response(JSON.stringify(list), { status: 200 });
    });

    // PATCH /api/sessions/{session} - This can be used to rename a session
    app.router.patch('/api/sessions(.*)', async (req: Router.IRequest, id: string) => {
      const options = req.body as any;
      const session = await sessions.patch(options);
      return new Response(JSON.stringify(session), { status: 200 });
    });

    // DELETE /api/sessions/{session} - Delete a session
    app.router.delete(
      '/api/sessions/(.+)',
      async (req: Router.IRequest, id: string) => {
        await sessions.shutdown(id);
        return new Response(null, { status: 204 });
      }
    );

    // POST /api/sessions - Create a new session or return an existing session if a session of the same name already exists
    app.router.post('/api/sessions', async (req: Router.IRequest) => {
      const options = req.body as any;
      const session = await sessions.startNew(options);
      return new Response(JSON.stringify(session), { status: 201 });
    });
  },
};

/**
 * The settings service plugin.
 */
const settingsPlugin: JupyterLiteServerPlugin<ISettings> = {
  id: '@datalayer/jupyterlite-server-extension:settings',
  autoStart: true,
  requires: [],
  provides: ISettings,
  activate: (app: JupyterLiteServer) => {
    const storageName = PageConfig.getOption('settingsStorageName');
    const storageDrivers = JSON.parse(
      PageConfig.getOption('settingsStorageDrivers') || 'null'
    );
    const settings = new Settings({ storageName, storageDrivers, localforage });
    app.started.then(() => settings.initialize().catch(console.warn));
    return settings;
  },
};

/**
 * A plugin providing the routes for the settings service.
 */
const settingsRoutesPlugin: JupyterLiteServerPlugin<void> = {
  id: '@datalayer/jupyterlite-server-extension:settings-routes',
  autoStart: true,
  requires: [ISettings],
  activate: (app: JupyterLiteServer, settings: ISettings) => {
    // TODO: improve the regex
    // const pluginPattern = new RegExp(/(?:@([^/]+?)[/])?([^/]+?):(\w+)/);
    const pluginPattern = '/api/settings/((?:@([^/]+?)[/])?([^/]+?):([^:]+))$';

    app.router.get(pluginPattern, async (req: Router.IRequest, pluginId: string) => {
      const setting = await settings.get(pluginId);
      return new Response(JSON.stringify(setting));
    });

    app.router.put(pluginPattern, async (req: Router.IRequest, pluginId: string) => {
      const body = req.body as any;
      const { raw } = body;
      await settings.save(pluginId, raw);
      return new Response(null, { status: 204 });
    });

    app.router.get('/api/settings', async (req: Router.IRequest) => {
      const plugins = await settings.getAll();
      return new Response(JSON.stringify(plugins));
    });
  },
};


const plugins: JupyterLiteServerPlugin<any>[] = [
  kernelsPlugin,
  kernelsRoutesPlugin,
  kernelSpecPlugin,
  kernelSpecRoutesPlugin,
  nbconvertRoutesPlugin,
  serviceWorkerPlugin,
  sessionsPlugin,
  sessionsRoutesPlugin,
  settingsPlugin,
  settingsRoutesPlugin,
];

export default plugins;
