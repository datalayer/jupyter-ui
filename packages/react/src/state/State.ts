/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useState, useMemo } from 'react';
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { ServiceManager } from '@jupyterlab/services';
import type { IDatalayerConfig } from './IState';
import { IJupyterConfig, loadJupyterConfig } from '../jupyter/JupyterConfig';
import useCellStore from '../components/cell/CellZustand';
import useConsoleStore from '../components/console/ConsoleZustand';
import useNotebookStore from '../components/notebook/NotebookZustand';
import useOutputStore from '../components/output/OutputZustand';
import useTerminalStore from '../components/terminal/TerminalZustand';
import { createLiteServer } from '../jupyter/lite/LiteServer';
import { getJupyterServerHttpUrl } from '../jupyter/JupyterConfig';
import { ensureJupyterAuth, createServerSettings, JupyterContextProps } from '../jupyter/JupyterContext';
import Kernel from '../jupyter/kernel/Kernel';

export type JupyterState = {
  datalayerConfig?: IDatalayerConfig;
  setDatalayerConfig: (configuration?: IDatalayerConfig) => void;
  version: string;
  setVersion: (version: string) => void;
  jupyterConfig?: IJupyterConfig;
  kernelIsLoading: boolean;
  kernel?: Kernel;
  serviceManager?: ServiceManager;
  cellStore: typeof useCellStore;
  consoleStore: typeof useConsoleStore;
  notebookStore: typeof useNotebookStore;
  outputStore: typeof useOutputStore;
  terminalStore: typeof useTerminalStore;
};

let initialConfiguration: IDatalayerConfig | undefined = undefined;

try {
  const rawConfig = document.getElementById('datalayer-config-data');
  if (rawConfig?.innerText) {
    initialConfiguration = JSON.parse(rawConfig?.innerText);
  }
} catch (error) {
  console.debug('No configuration found in the webpage.', error);
}

export const jupyterStore = createStore<JupyterState>((set, get) => ({
  datalayerConfig: initialConfiguration,
  setDatalayerConfig: (configuration?: IDatalayerConfig) => {
    set(state => ({ datalayerConfig: configuration }));
  },
  version: '',
  setVersion: version => {
    if (version && !get().version) {
      set(state => ({ version }));
    }
  },
  jupyterConfig: undefined,
  kernelIsLoading: true,
  kernel: undefined,
  serviceManager: undefined,
  serverSettings: undefined,
  cellStore: useCellStore,
  consoleStore: useConsoleStore,
  notebookStore: useNotebookStore,
  outputStore: useOutputStore,
  terminalStore: useTerminalStore,
}));

// TODO Reuse code portions from JupyterContext
export function useJupyterStore(): JupyterState;
export function useJupyterStore<T>(selector: (state: JupyterState) => T): T;
export function useJupyterStore<T>(selector?: (state: JupyterState) => T) {
  return useStore(jupyterStore, selector!);
}
export function useJupyterStoreFromContext(props: JupyterContextProps): JupyterState;
export function useJupyterStoreFromContext(props: JupyterContextProps) {
  const {
    defaultKernelName = 'python',
    initCode = '',
    lite = false,
    startDefaultKernel = true,
    useRunningKernelId,
    useRunningKernelIndex = -1,
    serverUrls,
  } = props;
  useMemo<IJupyterConfig>(() => {
    const config = loadJupyterConfig({});
    jupyterStore.getState().jupyterConfig = config;
    return config;
  }, []);
  const { baseUrl, wsUrl } = serverUrls ?? {};
  const [serviceManager, setServiceManager] = useState<ServiceManager>();
  const [_, setKernel] = useState<Kernel>();
  const [__, setIsLoading] = useState<boolean>(
    startDefaultKernel || useRunningKernelIndex > -1
  );
  // Create a service manager.
  useEffect(() => {
    if (lite) {
      createLiteServer().then(async liteServer => {
        // Load the browser kernel
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
        // Activate the loaded plugins
        await Promise.all(
          pluginIDs.filter(id => id).map(id => liteServer.activatePlugin(id!))
        );
        setServiceManager(liteServer.serviceManager);
        jupyterStore.getState().serviceManager = liteServer.serviceManager;
      });
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
        jupyterStore.getState().serviceManager = serviceManager;
      });
    }
  }, [baseUrl, wsUrl, lite]);
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
            jupyterStore.getState().kernel = wrappedKernel;
            setIsLoading(false);
            jupyterStore.getState().kernelIsLoading = false;
            break;
          }
          kernel = running.next();
          i++;
        }
        setIsLoading(false);
        jupyterStore.getState().kernelIsLoading = false;
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
          jupyterStore.getState().kernel = defaultKernel;
          setIsLoading(false);
          jupyterStore.getState().kernelIsLoading = false;
        });
      }
    });
  }, [lite, serviceManager]);
  return useStore(jupyterStore);
}

export default useJupyterStore;
