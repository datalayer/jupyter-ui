/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useState, useMemo } from 'react';
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { ServiceManager, Kernel as JupyterKernel } from '@jupyterlab/services';
import { getJupyterServerUrl, createLiteServiceManager, ensureJupyterAuth, createServerSettings, JupyterPropsType, DEFAULT_KERNEL_NAME } from '../jupyter';
import { ServiceManagerLess } from '../jupyter/services';
import { Kernel } from '../jupyter/kernel/Kernel';
import { IJupyterConfig, loadJupyterConfig } from '../jupyter/JupyterConfig';
import type { IDatalayerConfig } from './IDatalayerConfig';
import { cellsStore, CellsState } from '../components/cell/CellState';
import { consoleStore, ConsoleState } from '../components/console/ConsoleState';
import { notebookStore, NotebookState } from '../components/notebook/NotebookState';
import { outputsStore, OutputState } from '../components/output/OutputState';
import { terminalStore, TerminalState } from '../components/terminal/TerminalState';

export type OnKernelConnection = (kernelConnection: JupyterKernel.IKernelConnection | null | undefined) => void;

export type JupyterReactState = {
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
  setJupyterConfig: (configuration?: IJupyterConfig) => void;
  setServiceManager: (serviceManager?: ServiceManager.IManager) => void;
  setVersion: (version: string) => void;
};

let initialDatalayerConfig: IDatalayerConfig | undefined = undefined;

try {
  const pageConfig = document.getElementById('datalayer-config-data');
  if (pageConfig?.innerText) {
    initialDatalayerConfig = JSON.parse(pageConfig?.innerText);
  }
} catch (error) {
  console.debug('Issue with page configuration.', error);
}

export const jupyterReactStore = createStore<JupyterReactState>((set, get) => ({
  datalayerConfig: initialDatalayerConfig,
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
  setDatalayerConfig: (datalayerConfig?: IDatalayerConfig) => {
    set(state => ({ datalayerConfig }));
  },
  setJupyterConfig: (jupyterConfig?: IJupyterConfig) => {
    set(state => ({ jupyterConfig }));
  },
  setServiceManager: (serviceManager?: ServiceManager.IManager) => {
    set(state => ({ serviceManager }));
  },
  setVersion: version => {
    if (version && !get().version) {
      set(state => ({ version }));
    }
  },
}));

// TODO Reuse code portions from JupyterContext.
export function useJupyterReactStore(): JupyterReactState;

export function useJupyterReactStore<T>(selector: (state: JupyterReactState) => T): T;
export function useJupyterReactStore<T>(selector?: (state: JupyterReactState) => T) {
  return useStore(jupyterReactStore, selector!);
}

export function useJupyterReactStoreFromProps(props: JupyterPropsType): JupyterReactState;
export function useJupyterReactStoreFromProps(props: JupyterPropsType): JupyterReactState {
  const {
    collaborative = false,
    defaultKernelName = DEFAULT_KERNEL_NAME,
    initCode = '',
    jupyterServerToken = props.serviceManager?.serverSettings.token ?? '',
    jupyterServerUrl = props.serviceManager?.serverSettings.baseUrl ?? '',
    lite = false,
    serverless,
    serviceManager: propsServiceManager,
    startDefaultKernel = true,
    terminals = false,
    useRunningKernelId = props.useRunningKernelId,
    useRunningKernelIndex = props.useRunningKernelIndex || -1,
  } = props;

  const jupyterConfig = useMemo<IJupyterConfig>(() => {
    const config = loadJupyterConfig({
      lite,
      jupyterServerUrl,
      jupyterServerToken,
      collaborative,
      terminals,
    });
    jupyterReactStore.getState().setJupyterConfig(config);
    return config;
  }, []);

  const [serviceManager, setServiceManager] = useState<ServiceManager.IManager | undefined>(propsServiceManager);
  const [_, setKernel] = useState<Kernel>();
  const [__, setIsLoading] = useState<boolean>(startDefaultKernel || useRunningKernelIndex > -1);

  useEffect(() => {
    if (propsServiceManager) {
      console.log('Setting Service Manager from props', propsServiceManager);
      setServiceManager(propsServiceManager);
      jupyterReactStore.getState().setServiceManager(propsServiceManager);
    }
  }, [propsServiceManager]);

  // Setup a Service Manager if needed.
  useEffect(() => {
    if (serverless) {
      const serviceManager = new ServiceManagerLess();
      setServiceManager(serviceManager);
      jupyterReactStore.getState().setServiceManager(serviceManager);
      return;
    }
    if (!serviceManager) {
      if (lite) {
        createLiteServiceManager(lite).then(serviceManager => {
          setServiceManager(serviceManager);
          jupyterReactStore.getState().setServiceManager(serviceManager);
        });
        return;
      }
      const serverSettings = createServerSettings(
        jupyterConfig.jupyterServerUrl,
        jupyterConfig.jupyterServerToken,
      );
      ensureJupyterAuth(serverSettings).then(isAuth => {
        if (!isAuth) {
          const loginUrl = getJupyterServerUrl() + '/login?next=' + window.location;
          console.warn('You need to authenticate on the Jupyter Server URL', loginUrl);
  //          window.location.replace(loginUrl);
        }
        if (useRunningKernelId && useRunningKernelIndex > -1) {
          throw new Error('You can not ask for useRunningKernelId and useRunningKernelIndex at the same time.');
        }
        if (startDefaultKernel && (useRunningKernelId || useRunningKernelIndex > -1)) {
          throw new Error('You can not ask for startDefaultKernel and (useRunningKernelId or useRunningKernelIndex) at the same time.');
        }
        const serviceManager = new ServiceManager({ serverSettings });
        setServiceManager(serviceManager);
        jupyterReactStore.getState().setServiceManager(serviceManager);
      });  
    }
  }, [lite, serverless, jupyterServerUrl]);

  // Setup a Kernel if needed.
  useEffect(() => {
    serviceManager?.kernels.ready.then(async () => {
      const kernelManager = serviceManager.kernels;
      console.log('Jupyter Kernel Manager is ready', kernelManager);
      if (useRunningKernelIndex > -1) {
        await serviceManager.sessions.refreshRunning();
        const runnings = Array.from(kernelManager.running());
        const model = runnings[useRunningKernelIndex]
        const existingKernel = new Kernel({
          kernelManager,
          kernelName: model.name,
          kernelSpecName: model.name,
          kernelModel: model,
          kernelspecsManager: serviceManager.kernelspecs,
          sessionManager: serviceManager.sessions,
        });
        if (initCode) {
          try {
            await existingKernel.execute(initCode)?.done;
          } catch (error) {
            console.error('Failed to execute the initial code', error);
          }
        }
        setKernel(existingKernel);
        jupyterReactStore.getState().kernel = existingKernel;
        setIsLoading(false);
        jupyterReactStore.getState().kernelIsLoading = false;
      }
      else if (startDefaultKernel) {
        console.log('Starting a Jupyter Kernel:', defaultKernelName);
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
          jupyterReactStore.getState().kernel = defaultKernel;
          setIsLoading(false);
          jupyterReactStore.getState().kernelIsLoading = false;
        });
      }
    });
  }, [lite, serviceManager]);

  return useStore(jupyterReactStore);

}

export default useJupyterReactStore;
