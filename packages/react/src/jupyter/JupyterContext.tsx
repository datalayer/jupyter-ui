/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React, { createContext, useContext } from 'react';
import { Kernel as JupyterKernel, ServerConnection, ServiceManager } from '@jupyterlab/services';
import { useJupyterReactStoreFromProps } from '../state';
import { requestAPI } from './JupyterHandlers';
import { Lite } from './lite';
import { Kernel } from './kernel';

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
   * Jupyter Service Manager.
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
   * Default kernel
   */
  defaultKernel?: Kernel;
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
  /*
   * Create a serveless Jupyter.
   */
  serverless: boolean
  /**
   * Jupyter service manager.
   */
  serviceManager?: ServiceManager.IManager;
  /**
   * Jupyter Server settings.
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
 * User Jupyter hook.
 */
export const useJupyter = (props?: JupyterPropsType): JupyterContextType => {
  const context = useContext(JupyterContext);
  if (context) {
    // We are within a React Context, just return the JupyterContext.
    // The provided props are irrelevant in this case.
    return context;
  }
  // We are not within a React Context....
  // so create a JupyterContext from the store based on the provided props.
  const {
    jupyterConfig,
    kernel,
    kernelIsLoading,
    serviceManager,
  } = useJupyterReactStoreFromProps(props ?? {});
  const storeContext: JupyterContextType = {
    defaultKernel: kernel,
    jupyterServerUrl: jupyterConfig!.jupyterServerUrl,
    kernel,
    kernelIsLoading,
    kernelManager: serviceManager?.kernels,
    lite: props?.lite,
    serverless: props?.serverless ?? false,
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
  const { children, skeleton } = props;
  const {
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
        defaultKernel: kernel,
        // FIXME we should not expose sub attributes to promote single source of truth (like URLs coming from serverSettings).
        jupyterServerUrl,
        kernel,
        kernelIsLoading,
        kernelManager: serviceManager?.kernels,
        lite,
        serverSettings,
        serverless: props.serverless ?? false,
        serviceManager,
      }}
    >
      { kernelIsLoading && skeleton }
      { children }
    </JupyterProvider>
  );

}
