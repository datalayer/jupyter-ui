/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useState, useMemo } from 'react';
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import {
  ServiceManager,
  Kernel as JupyterKernel,
  Session,
} from '@jupyterlab/services';
import { setupPrimerPortals } from '@datalayer/primer-addons';
import {
  getJupyterServerUrl,
  createLiteServiceManager,
  DEFAULT_KERNEL_NAME,
} from '../jupyter';
import { ServiceManagerLess } from '../jupyter/services';
import { JupyterLabAppAdapter } from '../components/jupyterlab';
import { Kernel } from '../jupyter/kernel/Kernel';
import { IJupyterConfig, loadJupyterConfig } from '../jupyter/JupyterConfig';
import { cellsStore, CellsState } from '../components/cell/CellState';
import { consoleStore, ConsoleState } from '../components/console/ConsoleState';
import {
  notebookStore,
  NotebookState,
} from '../components/notebook/NotebookState';
import { outputsStore, OutputState } from '../components/output/OutputState';
import {
  terminalStore,
  TerminalState,
} from '../components/terminal/TerminalState';
import { IJupyterProps } from '../jupyter';
import { Colormode } from '../theme';
import { createServerSettings, ensureJupyterAuth } from '../utils';

export type OnSessionConnection = (
  kernelConnection: Session.ISessionConnection | undefined
) => void;

export type KernelTransfer = {
  transfer: (to: JupyterKernel.IKernelConnection) => void;
};

export type JupyterReactState = {
  cellsStore: CellsState;
  consoleStore: ConsoleState;
  jupyterConfig?: IJupyterConfig;
  kernel?: Kernel;
  kernelIsLoading: boolean;
  notebookStore: NotebookState;
  outputStore: OutputState;
  serviceManager?: ServiceManager.IManager;
  terminalStore: TerminalState;
  version: string;
  colormode: Colormode;
  /**
   * Optional background color override.
   * When set (e.g. by JupyterReactTheme), notebook extensions such as
   * cell sidebars can read this value and render with the same background.
   */
  backgroundColor?: string;
  /**
   * JupyterLabApp adapter.
   */
  jupyterLabAdapter?: JupyterLabAppAdapter;
  /**
   * Set the JupyterLabAdapter.
   */
  setJupyterLabAdapter: (jupyterLabAdapter: JupyterLabAppAdapter) => void;
  setJupyterConfig: (configuration?: IJupyterConfig) => void;
  setServiceManager: (serviceManager?: ServiceManager.IManager) => void;
  setVersion: (version: string) => void;
  setColormode: (colormode: Colormode) => void;
  setBackgroundColor: (backgroundColor?: string) => void;
};

// Module-level default configuration
// This ensures the store is NEVER undefined, preventing crashes when child components
// access it during initial render. Updates to match props happen after render completes.
const DEFAULT_CONFIG: IJupyterConfig = loadJupyterConfig({
  collaborative: false,
  lite: false,
  jupyterServerUrl: undefined,
  jupyterServerToken: undefined,
  terminals: false,
});

export const jupyterReactStore = createStore<JupyterReactState>((set, get) => ({
  version: '',
  jupyterLabAdapter: undefined,
  jupyterConfig: DEFAULT_CONFIG,
  kernelIsLoading: true,
  kernel: undefined,
  serviceManager: undefined,
  cellsStore: cellsStore.getState(),
  consoleStore: consoleStore.getState(),
  notebookStore: notebookStore.getState(),
  outputStore: outputsStore.getState(),
  terminalStore: terminalStore.getState(),
  colormode: 'light',
  backgroundColor: undefined,
  setJupyterLabAdapter: (jupyterLabAdapter: JupyterLabAppAdapter) => {
    set(_state => ({ jupyterLabAdapter }));
  },
  setJupyterConfig: (jupyterConfig?: IJupyterConfig) => {
    set(_state => ({ jupyterConfig }));
  },
  setServiceManager: (serviceManager?: ServiceManager.IManager) => {
    set(_state => ({ serviceManager }));
  },
  setVersion: version => {
    if (version && !get().version) {
      set(_state => ({ version }));
    }
  },
  setColormode: colormode => {
    // Resolve 'auto' to the actual OS preference before calling
    // setupPrimerPortals, which sets DOM data-attributes for Primer.
    const resolved =
      colormode === 'auto'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : colormode;
    setupPrimerPortals(resolved);
    set(_state => ({ colormode }));
  },
  setBackgroundColor: (backgroundColor?: string) => {
    set(_state => ({ backgroundColor }));
  },
}));

// Module-level flag to ensure config is only initialized once
// This prevents render-during-render warnings when multiple components
// call useJupyterReactStoreFromProps simultaneously
let configInitializationScheduled = false;

// TODO Reuse code portions from JupyterContext.
export function useJupyterReactStore(): JupyterReactState;

export function useJupyterReactStore<T>(
  selector: (state: JupyterReactState) => T
): T;
export function useJupyterReactStore<T>(
  selector?: (state: JupyterReactState) => T
) {
  return useStore(jupyterReactStore, selector!);
}

export function useJupyterReactStoreFromProps(
  props: IJupyterProps
): JupyterReactState;
export function useJupyterReactStoreFromProps(
  props: IJupyterProps
): JupyterReactState {
  const {
    defaultKernelName = DEFAULT_KERNEL_NAME,
    initCode = '',
    jupyterServerToken = props.serviceManager?.serverSettings.token,
    jupyterServerUrl = props.serviceManager?.serverSettings.baseUrl,
    lite = false,
    serverless,
    serviceManager: propsServiceManager,
    startDefaultKernel = false,
    terminals = false,
    useRunningKernelId = props.useRunningKernelId,
    useRunningKernelIndex = props.useRunningKernelIndex || -1,
  } = props;

  const jupyterConfig = useMemo<IJupyterConfig>(() => {
    // Store always has DEFAULT_CONFIG, so we can safely access it
    const storeConfig = jupyterReactStore.getState().jupyterConfig!;

    // Create config from props
    const config = loadJupyterConfig({
      collaborative: false,
      lite,
      jupyterServerUrl,
      jupyterServerToken,
      terminals,
    });

    // Check if config needs updating (compare actual IJupyterConfig fields)
    const needsUpdate =
      storeConfig.jupyterServerUrl !== config.jupyterServerUrl ||
      storeConfig.jupyterServerToken !== config.jupyterServerToken;

    // Defer update to after render completes (prevents render-during-render warning)
    if (needsUpdate && !configInitializationScheduled) {
      configInitializationScheduled = true;
      queueMicrotask(() => {
        jupyterReactStore.getState().setJupyterConfig(config);
        configInitializationScheduled = false; // Reset flag for future updates
      });
    }

    // Return the config from props (components use this immediately)
    return config;
  }, [lite, jupyterServerUrl, jupyterServerToken, terminals]);

  const [serviceManager, setServiceManager] = useState<
    ServiceManager.IManager | undefined
  >(propsServiceManager);
  const [_, setKernel] = useState<Kernel>();
  const [__, setIsLoading] = useState<boolean>(
    startDefaultKernel || useRunningKernelIndex > -1
  );

  useEffect(() => {
    if (propsServiceManager) {
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
          jupyterReactStore.getState().setServiceManager(serviceManager);
          setServiceManager(serviceManager);
        });
        return;
      }
      const serverSettings = createServerSettings(
        jupyterConfig.jupyterServerUrl,
        jupyterConfig.jupyterServerToken
      );
      ensureJupyterAuth(serverSettings).then(isAuth => {
        if (!isAuth) {
          const loginUrl =
            getJupyterServerUrl() + '/login?next=' + window.location;
          console.warn(
            'You need to authenticate on the Jupyter Server URL',
            loginUrl
          );
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
          throw new Error(
            'You can not ask for startDefaultKernel and (useRunningKernelId or useRunningKernelIndex) at the same time.'
          );
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
      if (useRunningKernelIndex > -1) {
        await serviceManager.sessions.refreshRunning();
        const runnings = Array.from(serviceManager.kernels.running());
        const model = runnings[useRunningKernelIndex];
        const existingKernel = new Kernel({
          kernelManager: serviceManager.kernels,
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
      } else if (startDefaultKernel) {
        const defaultKernel = new Kernel({
          kernelName: defaultKernelName,
          kernelSpecName: defaultKernelName,
          kernelManager: serviceManager.kernels,
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
          setKernel(defaultKernel);
          jupyterReactStore.getState().kernel = defaultKernel;
          setIsLoading(false);
          jupyterReactStore.getState().kernelIsLoading = false;
        });
      }
    });
  }, [serviceManager]);

  return useStore(jupyterReactStore);
}

export default useJupyterReactStore;
