/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import {
  Kernel as CoreKernel,
  ServerConnection,
  ServiceManager,
} from '@jupyterlab/services';
import type { JupyterLiteServerPlugin } from '@jupyterlite/server';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import defaultInjectableStore, { InjectableStore } from '../state/redux/Store';
// import { createLiteServer } from './../jupyter/lite/LiteServer';
import { getJupyterServerHttpUrl, getJupyterToken } from './JupyterConfig';
import { requestAPI } from './JupyterHandlers';
import Kernel from './kernel/Kernel';

export type Lite =
  | boolean
  | Promise<{ default: JupyterLiteServerPlugin<any>[] }>;

/**
 * The type for the Jupyter context.
 */
export type JupyterContextType = {
  /**
   * Whether the component is collaborative or not.
   */
  collaborative?: boolean;
  /**
   * Default kernel
   */
  defaultKernel?: Kernel;
  /**
   * Will be true while waiting for the default kernel.
   *
   * If `true`, it does not ensure a default kernel will
   * be created successfully.
   *
   * This is useful to not mount to quickly a Lumino Widget
   * to be unmount right away when the default kernel will
   * be available.
   */
  defaultKernelIsLoading: boolean;
  injectableStore: InjectableStore;
  kernelManager?: CoreKernel.IManager;
  /**
   * If `true`, it will load the Pyodide jupyterlite kernel.
   *
   * You can also set it to dynamically import any jupyterlite
   * kernel package.
   *
   * If defined, {@link serverUrls} and {@link defaultKernelName}
   * will be ignored and the component will run this in-browser
   * kernel.
   *
   * @example
   * `lite: true` => Load dynamically the package @jupyterlite/pyodide-kernel-extension
   *
   * `lite: import('@jupyterlite/javascript-kernel-extension')` => Load dynamically
   */
  lite?: Lite;
  /**
   * Jupyter Server settings
   *
   * This is useless if running an in-browser kernel via {@link lite}.
   */
  serverSettings: ServerConnection.ISettings;
  /**
   * Jupyter services manager
   */
  serviceManager?: ServiceManager;
  setVariant: (value: string) => void;
  variant: string;
  /**
   * Jupyter Server base URL
   *
   * Useless if running an in-browser kernel.
   */
  baseUrl: string;
  /**
   * Jupyter Server websocket URL
   *
   * Useless if running an in-browser kernel.
   */
  wsUrl: string;
};

/**
 * The instance for the Jupyter context.
 */
export const JupyterContext = createContext<JupyterContextType | undefined>(
  undefined
);

export const useJupyter = (): JupyterContextType => {
  const context = useContext(JupyterContext);
  if (!context) {
    throw new Error('useContext must be inside a provider with a value.');
  }
  return context;
};

/**
 * The type for the Jupyter context consumer.
 */
export const JupyterContextConsumer = JupyterContext.Consumer;

/**
 * The type for the Jupyter context provider.
 */
const JupyterProvider = JupyterContext.Provider;

/**
 * Utility method to ensure the Jupyter context is authenticated
 * with the Jupyter server.
 */
export const ensureJupyterAuth = async (
  serverSettings: ServerConnection.ISettings
): Promise<boolean> => {
  try {
    await requestAPI<any>(serverSettings, 'api', '');
    return true;
  } catch (reason) {
    console.log('The Jupyter Server API has failed with reason', reason);
    return false;
  }
};

/**
 * Jupyter Server URLs
 */
export interface IServerUrls {
  /**
   * The base url of the server.
   */
  readonly baseUrl: string;
  /**
   * The base ws url of the server.
   */
  readonly wsUrl: string;
}

/**
 * The Jupyter context properties type.
 */
export type JupyterContextProps = React.PropsWithChildren<{
  /**
   * Whether the component is collaborative or not.
   */
  collaborative?: boolean;
  /**
   * Default kernel name
   */
  defaultKernelName?: string;
  /**
   * Code to be executed silently at kernel startup
   *
   * This is ignored if there is no default kernel.
   */
  initCode?: string;
  /**
   * URL to fetch a JupyterLite kernel (i.e. in-browser kernel).
   *
   * If defined, {@link serverUrls} and {@link defaultKernelName}
   * will be ignored and the component will run this in-browser
   * kernel.
   *
   * @example
   * https://cdn.jsdelivr.net/npm/@jupyterlite/pyodide-kernel-extension
   */
  lite?: Lite;
  /**
   * Jupyter Server URLs to connect to.
   *
   * It will be ignored if a {@link lite} is provided.
   */
  serverUrls?: IServerUrls;
  /**
   * Whether to start the default kernel or not.
   */
  startDefaultKernel?: boolean;
  /**
   * A loader to display while the kernel is being setup.
   */
  skeleton?: JSX.Element;

  // Advanced properties
  injectableStore?: InjectableStore;
  useRunningKernelId?: string;
  useRunningKernelIndex?: number;
  variant?: string;
}>;

export const createServerSettings = (baseUrl: string, wsUrl: string) => {
  return ServerConnection.makeSettings({
    baseUrl,
    wsUrl,
    token: getJupyterToken(),
    appendToken: true,
    init: {
      mode: 'cors',
      credentials: 'include',
      cache: 'no-store',
    },
  });
};

/**
 * The Jupyter context provider.
 */
export const JupyterContextProvider: React.FC<JupyterContextProps> = props => {
  const {
    children,
    collaborative = false,
    defaultKernelName = 'python',
    initCode = '',
    injectableStore = defaultInjectableStore,
    lite = false,
    startDefaultKernel = true,
    useRunningKernelId,
    useRunningKernelIndex = -1,
    skeleton = <></>,
    variant = 'default',
    serverUrls,
  } = props;

  const { baseUrl, wsUrl } = serverUrls ?? {};

  const [_, setVariant] = useState(variant);

  const [serviceManager, setServiceManager] = useState<ServiceManager>();
  const [kernel, setKernel] = useState<Kernel>();
  const [kernelIsLoading, setIsLoading] = useState<boolean>(
    startDefaultKernel || useRunningKernelIndex > -1
  );

  // Create a service manager
  useEffect(() => {
    if (lite) {
      // createLiteServer().then(async liteServer => {
      //   // Load the browser kernel
      //   const mod =
      //     typeof lite === 'boolean'
      //       ? await import('@jupyterlite/pyodide-kernel-extension')
      //       : await lite;
      //   // Load the module manually to get the list of plugin IDs
      //   let data = mod.default;
      //   // Handle commonjs exports.
      //   if (!Object.prototype.hasOwnProperty.call(mod, '__esModule')) {
      //     data = mod as any;
      //   }
      //   if (!Array.isArray(data)) {
      //     data = [data];
      //   }
      //   const pluginIDs = data.map(item => {
      //     try {
      //       liteServer.registerPlugin(item);
      //       return item.id;
      //     } catch (error) {
      //       console.error(error);
      //       return null;
      //     }
      //   });

      //   // Activate the loaded plugins
      //   await Promise.all(
      //     pluginIDs.filter(id => id).map(id => liteServer.activatePlugin(id!))
      //   );
      //   setServiceManager(liteServer.serviceManager);
      // });
    } else {
      const serverSettings = createServerSettings(baseUrl ?? '', wsUrl ?? '');
      ensureJupyterAuth(serverSettings).then(isAuth => {
        if (!isAuth) {
          const loginUrl =
            getJupyterServerHttpUrl() + '/login?next=' + window.location;
          console.warn('Redirecting to Jupyter Server login URL', loginUrl);
          window.location.replace(loginUrl);
        }
        if (useRunningKernelId && useRunningKernelIndex > -1) {
          throw new Error(
            'You can not ask for useRunningKernelId and useRunningKernelIndex at the same time.'
          );
        }
        if (
          startDefaultKernel &&
          (useRunningKernelId || useRunningKernelIndex > -1)
        ) {
          throw new Error(
            'You can not ask for startDefaultKernel and (useRunningKernelId or useRunningKernelIndex) at the same time.'
          );
        }
        const serviceManager = new ServiceManager({ serverSettings });
        setServiceManager(serviceManager);
      });
    }
    setVariant(variant);
  }, [baseUrl, wsUrl, lite, variant]);

  // Create a kernel
  useEffect(() => {
    serviceManager?.kernels.ready.then(async () => {
      const kernelManager = serviceManager.kernels;
      console.log('Kernel Manager is Ready', kernelManager);
      if (useRunningKernelIndex > -1) {
        const running = kernelManager.running();
        let kernel = running.next();
        let i = 0;
        while (!kernel.done) {
          if (i === useRunningKernelIndex) {
            const wrappedKernel = new Kernel({
              kernelManager,
              kernelName: defaultKernelName,
              kernelSpecName: defaultKernelName,
              kernelModel: kernel.value,
              kernelType: 'notebook',
              kernelspecsManager: serviceManager.kernelspecs,
              sessionManager: serviceManager.sessions,
            });
            if (initCode) {
              try {
                await wrappedKernel.execute(initCode)?.done;
              } catch (error) {
                console.error('Failed to execute the initial code', error);
              }
            }
            setKernel(wrappedKernel);
            setIsLoading(false);
            break;
          }
          kernel = running.next();
          i++;
        }
        setIsLoading(false);
      } else if (startDefaultKernel) {
        console.log('Starting Kernel Name:', defaultKernelName);
        const defaultKernel = new Kernel({
          kernelManager,
          kernelName: defaultKernelName,
          kernelSpecName: defaultKernelName,
          kernelType: 'notebook',
          kernelspecsManager: serviceManager.kernelspecs,
          sessionManager: serviceManager.sessions,
        });
        defaultKernel.ready.then(async () => {
          if (initCode) {
            try {
              await defaultKernel.execute(initCode)?.done;
            } catch (error) {
              console.error('Failed to execute the initial code', error);
            }
          }
          console.log('Kernel is Ready', defaultKernel);
          setKernel(defaultKernel);
          setIsLoading(false);
        });
      }
    });
  }, [lite, serviceManager]);

  return (
    <ReduxProvider store={injectableStore}>
      <JupyterProvider
        value={{
          // FIXME we should not expose sub attributes
          // to promote single source of truth (like URLs come from serverSettings)
          baseUrl: serviceManager?.serverSettings.baseUrl ?? '',
          collaborative,
          defaultKernel: kernel,
          defaultKernelIsLoading: kernelIsLoading,
          injectableStore,
          kernelManager: serviceManager?.kernels,
          lite: lite,
          serverSettings:
            serviceManager?.serverSettings ?? createServerSettings('', ''),
          serviceManager,
          setVariant,
          variant,
          wsUrl: serviceManager?.serverSettings.wsUrl ?? '',
        }}
      >
        {kernelIsLoading ? skeleton : children}
      </JupyterProvider>
    </ReduxProvider>
  );
};
