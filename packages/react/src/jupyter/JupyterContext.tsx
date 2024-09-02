/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React, { createContext, useContext } from 'react';
import { Kernel as JupyterKernel, ServerConnection, ServiceManager } from '@jupyterlab/services';
import type { JupyterLiteServerPlugin } from '@jupyterlite/server';
import { requestAPI } from './JupyterHandlers';
import Kernel from './kernel/Kernel';
import { useJupyterReactStoreFromProps } from '../state';

export type Lite =
  | boolean
  | Promise<{ default: JupyterLiteServerPlugin<any>[] }>;

/**
 * The type for Jupyter props.
 */
export type JupyterPropsType = {
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
   * 
   * https://cdn.jsdelivr.net/npm/@jupyterlite/pyodide-kernel-extension
   */
  lite?: Lite;
  /*
   * Jupyter Server base URL.
   *
   * Useless if running an in-browser kernel.
   */
  jupyterServerUrl?: string;
  /*
   * Jupyter Server Token.
   */
  jupyterServerToken?: string;
  /*
   * Create a serveless Jupyter.
   */
  serverless?: boolean
  /**
   * Jupyter Server settings
   *
   * This is useless if running an in-browser kernel via {@link lite}.
   */
  serviceManager?: ServiceManager.IManager;
  /**
   * Whether to start the default kernel or not.
   */
  startDefaultKernel?: boolean;
  /**
   * A loader to display while the kernel is being setup.
   */
  skeleton?: JSX.Element;
  /**
   * The Kernel Id to use, as defined in the Kernel API
   */
  useRunningKernelId?: string;
  /**
   * The index (aka position) of the Kernel to use in the list of kernels.
   */
  useRunningKernelIndex?: number;
  /*
   * Allow the terminal usage.
   */
  terminals?: boolean;
}

/**
 * The type for Jupyter context.
 */
export type JupyterContextType =  {
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
  /**
   * Jupyter Server base URL
   *
   * Useless if running an in-browser kernel.
   */
  jupyterServerUrl: string;
  /**
   * Kernel
   */
  kernel?: Kernel;
  /**
   * Kernel
   */
  kernelIsLoading: boolean;
  /**
   * The Kernel Manager.
   */
  kernelManager?: JupyterKernel.IManager;
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
   * 
   * `lite: true` => Load dynamically the package @jupyterlite/pyodide-kernel-extension
   *
   * `lite: import('@jupyterlite/javascript-kernel-extension')` => Load dynamically
   */
  lite?: Lite;
  /**
   * Jupyter services manager
   */
  serviceManager?: ServiceManager.IManager;
  /**
   * Jupyter Server settings
   *
   * This is useless if running an in-browser kernel via {@link lite}.
   */
  serverSettings?: ServerConnection.ISettings;
};

/**
 * The Jupyter context properties type.
 */
export type JupyterContextProps = React.PropsWithChildren<JupyterPropsType>;

/**
 * The instance for the Jupyter context.
 */
export const JupyterContext = createContext<JupyterContextType | undefined>(
  undefined
);

/**
 * The type for the Jupyter context consumer.
 */
export const JupyterContextConsumer = JupyterContext.Consumer;

/**
 * The type for the Jupyter context provider.
 */
const JupyterProvider = JupyterContext.Provider;

/*
 *
 */
export const useJupyter = (props?: JupyterPropsType): JupyterContextType => {
  const context = useContext(JupyterContext);
  if (context) {
    // We are with in a Jupyter context, returning fast the context.
    return context;
  }
  // We are not within a Jupyter context, so create it from the store.
  const {
    kernel,
    kernelIsLoading,
    serviceManager,
    jupyterConfig,
  } = useJupyterReactStoreFromProps(props ?? {});
  const storeContext: JupyterContextType = {
    collaborative: false,
    defaultKernel: kernel,
    defaultKernelIsLoading: kernelIsLoading,
    jupyterServerUrl: jupyterConfig!.jupyterServerUrl,
    kernel,
    kernelIsLoading,
    kernelManager: serviceManager?.kernels,
    lite: false,
    serverSettings: serviceManager?.serverSettings,
    serviceManager,
  }
  return storeContext;
};

/**
 * Utility method to ensure the Jupyter context
 * is authenticated with the Jupyter server.
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

/*
 *
 */
export const createServerSettings = (jupyterServerUrl: string, jupyterServerToken: string) => {
  return ServerConnection.makeSettings({
    baseUrl: jupyterServerUrl,
    wsUrl: jupyterServerUrl.replace(/^http/, 'ws'),
    token: jupyterServerToken,
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
export const JupyterContextProvider: React.FC<JupyterContextProps> = (props) => {
  const {
    children,
    skeleton,
  } = props;
  const {
    collaborative,
    jupyterServerUrl,
    kernel,
    kernelIsLoading,
    lite,
    serverSettings,
    serviceManager,
  } = useJupyter(props);
  return (
    <JupyterProvider
      value={{
        collaborative,
        defaultKernel: kernel,
        defaultKernelIsLoading: kernelIsLoading,
        // FIXME we should not expose sub attributes to promote single source of truth
        // (like URLs come from serverSettings)
        jupyterServerUrl,
        kernel,
        kernelIsLoading,
        kernelManager: serviceManager?.kernels,
        lite,
        serverSettings,
        serviceManager,
      }}
    >
      { kernelIsLoading && skeleton }
      { children }
    </JupyterProvider>
  );

}
