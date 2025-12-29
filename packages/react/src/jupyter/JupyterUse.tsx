/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import {
  Kernel as JupyterKernel,
  ServerConnection,
  ServiceManager,
} from '@jupyterlab/services';
import { useJupyterReactStoreFromProps } from '../state';
import { Lite } from './lite';
import { Kernel } from './kernel';

/**
 * The type for Jupyter props.
 */
export type IJupyterProps = {
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
   * If defined, `serverUrls` and `defaultKernelName`
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
  serverless?: boolean;
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
};

/**
 * The type for Jupyter context.
 */
export type IJupyterContext = {
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
   * If defined, `serverUrls` and `defaultKernelName`
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
  serverless: boolean;
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

/*
 * Use Jupyter hook.
 */
export const useJupyter = (props?: IJupyterProps): IJupyterContext => {
  // Always call the hook, but only use its result if there's no context
  const { jupyterConfig, kernel, kernelIsLoading, serviceManager } =
    useJupyterReactStoreFromProps(props ?? {});

  const context: IJupyterContext = {
    defaultKernel: kernel,
    jupyterServerUrl: jupyterConfig!.jupyterServerUrl,
    kernel,
    kernelIsLoading,
    kernelManager: serviceManager?.kernels,
    lite: props?.lite,
    serverless: props?.serverless ?? false,
    serverSettings: serviceManager?.serverSettings,
    serviceManager,
  };
  return context;
};
