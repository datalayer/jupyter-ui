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
import { cellsStore, CellsState } from '../components/cell/CellState';
import { consoleStore, ConsoleState } from '../components/console/ConsoleState';
import { notebookStore, NotebookState } from '../components/notebook/NotebookState';
import { outputsStore, OutputState } from '../components/output/OutputState';
import { terminalStore, TerminalState } from '../components/terminal/TerminalState';
import { createLiteServer } from '../jupyter/lite/LiteServer';
import { getJupyterServerUrl } from '../jupyter/JupyterConfig';
import { ensureJupyterAuth, createServerSettings, JupyterPropsType } from '../jupyter/JupyterContext';
import Kernel from '../jupyter/kernel/Kernel';
import { JupyterServiceManagerMock } from '../jupyter/services';

export type JupyterState = {
  cellsStore: CellsState;
  consoleStore: ConsoleState;
  datalayerConfig?: IDatalayerConfig;
  jupyterConfig?: IJupyterConfig;
  kernel?: Kernel;
  kernelIsLoading: boolean;
  notebookStore: NotebookState;
  outputStore: OutputState;
  serviceManager?: ServiceManager.IManager;
  terminalStore: TerminalState;
  version: string;
  setDatalayerConfig: (configuration?: IDatalayerConfig) => void;
  setVersion: (version: string) => void;
};

let initialConfiguration: IDatalayerConfig | undefined = undefined;

try {
  const pageConfig = document.getElementById('datalayer-config-data');
  if (pageConfig?.innerText) {
    initialConfiguration = JSON.parse(pageConfig?.innerText);
  }
} catch (error) {
  console.debug('Issue with page configuration.', error);
}

export const jupyterStore = createStore<JupyterState>((set, get) => ({
  datalayerConfig: initialConfiguration,
  version: '',
  jupyterConfig: undefined,
  kernelIsLoading: true,
  kernel: undefined,
  serviceManager: undefined,
  serverSettings: undefined,
  cellsStore: cellsStore.getState(),
  consoleStore: consoleStore.getState(),
  notebookStore: notebookStore.getState(),
  outputStore: outputsStore.getState(),
  terminalStore: terminalStore.getState(),
  setDatalayerConfig: (configuration?: IDatalayerConfig) => {
    set(state => ({ datalayerConfig: configuration }));
  },
  setVersion: version => {
    if (version && !get().version) {
      set(state => ({ version }));
    }
  },
}));

// TODO Reuse code portions from JupyterContext
export function useJupyterStore(): JupyterState;
export function useJupyterStore<T>(selector: (state: JupyterState) => T): T;
export function useJupyterStore<T>(selector?: (state: JupyterState) => T) {
  return useStore(jupyterStore, selector!);
}
export function useJupyterStoreFromContext(props: JupyterPropsType): JupyterState;
export function useJupyterStoreFromContext(props: JupyterPropsType): JupyterState {
  const {
    collaborative = false,
    defaultKernelName = 'python',
    initCode = '',
    jupyterServerToken = '60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6',
    jupyterServerUrl = 'https://oss.datalayer.run/api/jupyter-server',
    lite = false,
    serverless,
    serviceManager: propsServiceManager,
    startDefaultKernel = true,
    terminals = false,
    useRunningKernelId,
    useRunningKernelIndex = -1,
  } = props;
  const config = useMemo<IJupyterConfig>(() => {
    const config = loadJupyterConfig({
      lite,
      jupyterServerUrl,
      jupyterServerToken,
      collaborative,
      terminals,
    });
    jupyterStore.getState().jupyterConfig = config;
    return config;
  }, []);
  const [serviceManager, setServiceManager] = useState<ServiceManager.IManager | undefined>(propsServiceManager);
  const [_, setKernel] = useState<Kernel>();
  const [__, setIsLoading] = useState<boolean>(startDefaultKernel || useRunningKernelIndex > -1);
  // Create a service manager.
  useEffect(() => {
    if (propsServiceManager) {
      setServiceManager(propsServiceManager);
      jupyterStore.getState().serviceManager = propsServiceManager;
      return;
    }
    if (serverless) {
      const serviceManager = new JupyterServiceManagerMock();
      setServiceManager(serviceManager);
      jupyterStore.getState().serviceManager = serviceManager;
      return;
    }
    if (!serviceManager) {
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
        return;
      }
      const serverSettings = createServerSettings(
        config.jupyterServerUrl,
        config.jupyterServerToken,
      );
      ensureJupyterAuth(serverSettings).then(isAuth => {
        if (!isAuth) {
          const loginUrl = getJupyterServerUrl() + '/login?next=' + window.location;
          console.warn('You need to authenticate on the Jupyter Server URL', loginUrl);
//          window.location.replace(loginUrl);
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
          throw new Error('You can not ask for startDefaultKernel and (useRunningKernelId or useRunningKernelIndex) at the same time.');
        }
        const serviceManager = new ServiceManager({ serverSettings });
        setServiceManager(serviceManager);
        jupyterStore.getState().serviceManager = serviceManager;
      });
    }
  }, [propsServiceManager, jupyterServerUrl, lite, serverless]);
  useEffect(() => {
    // Create a kernel if needed
    serviceManager?.kernels.ready.then(async () => {
      const kernelManager = serviceManager.kernels;
      console.log('Jupyter Kernel Manager is ready', kernelManager);
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
        console.log('Starting Jupyter Kernel:', defaultKernelName);
        const defaultKernel = new Kernel({
          kernelManager,
          kernelName: defaultKernelName,
          kernelSpecName: defaultKernelName,
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
          console.log('Jupyter Kernel is ready', defaultKernel);
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
