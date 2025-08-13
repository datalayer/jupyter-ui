/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { ServiceManager, ServerConnection } from '@jupyterlab/services';
import { ServiceManagerLess } from '../jupyter/services/ServiceManagerLess';

/**
 * Configuration for creating a ServiceManager
 */
export interface IServiceManagerConfig {
  baseUrl: string;
  wsUrl?: string;
  token?: string;
  appendToken?: boolean;
}

/**
 * Creates a standard JupyterLab ServiceManager with the given configuration
 * 
 * @param config - Server configuration
 * @returns A configured ServiceManager instance
 * 
 * @example
 * ```ts
 * const serviceManager = createServiceManager({
 *   baseUrl: 'http://localhost:8888',
 *   token: 'your-token'
 * });
 * ```
 */
export function createServiceManager(config: IServiceManagerConfig): ServiceManager.IManager {
  const serverSettings = ServerConnection.makeSettings({
    baseUrl: config.baseUrl,
    wsUrl: config.wsUrl || config.baseUrl.replace(/^http/, 'ws'),
    token: config.token || '',
    appendToken: config.appendToken !== false,
  });

  return new ServiceManager({ serverSettings });
}

/**
 * Creates a ServiceManager for a local Jupyter server
 * Uses default localhost settings
 * 
 * @param port - Port number (default: 8888)
 * @param token - Optional authentication token
 * @returns A ServiceManager configured for localhost
 * 
 * @example
 * ```ts
 * const serviceManager = createLocalServiceManager(8888, 'token');
 * ```
 */
export function createLocalServiceManager(
  port: number = 8888,
  token?: string
): ServiceManager.IManager {
  return createServiceManager({
    baseUrl: `http://localhost:${port}`,
    token,
  });
}

/**
 * Creates a ServiceManager for a remote Jupyter server
 * 
 * @param url - Full URL to the Jupyter server
 * @param token - Authentication token
 * @returns A ServiceManager configured for the remote server
 * 
 * @example
 * ```ts
 * const serviceManager = createRemoteServiceManager(
 *   'https://jupyter.example.com',
 *   'auth-token'
 * );
 * ```
 */
export function createRemoteServiceManager(
  url: string,
  token: string
): ServiceManager.IManager {
  return createServiceManager({
    baseUrl: url,
    token,
    appendToken: true,
  });
}

/**
 * Creates a ServiceManagerLess instance for serverless/readonly mode
 * This is useful when you don't have a real Jupyter server
 * 
 * @returns A ServiceManagerLess instance
 * 
 * @example
 * ```ts
 * const serviceManager = createServerlessServiceManager();
 * ```
 */
export function createServerlessServiceManager(): ServiceManager.IManager {
  return new ServiceManagerLess();
}

/**
 * Creates a ServiceManager with custom WebSocket URL
 * Useful for servers with non-standard WebSocket endpoints
 * 
 * @param baseUrl - HTTP(S) URL to the server
 * @param wsUrl - WebSocket URL
 * @param token - Optional authentication token
 * @returns A ServiceManager with custom WebSocket configuration
 * 
 * @example
 * ```ts
 * const serviceManager = createCustomServiceManager(
 *   'https://jupyter.example.com',
 *   'wss://ws.jupyter.example.com',
 *   'token'
 * );
 * ```
 */
export function createCustomServiceManager(
  baseUrl: string,
  wsUrl: string,
  token?: string
): ServiceManager.IManager {
  return createServiceManager({
    baseUrl,
    wsUrl,
    token,
  });
}

/**
 * Creates multiple ServiceManagers for different environments
 * Useful for applications that need to connect to multiple Jupyter servers
 * 
 * @param configs - Array of service manager configurations
 * @returns Map of named ServiceManagers
 * 
 * @example
 * ```ts
 * const managers = createMultipleServiceManagers([
 *   { name: 'local', config: { baseUrl: 'http://localhost:8888' } },
 *   { name: 'remote', config: { baseUrl: 'https://jupyter.example.com', token: 'xyz' } },
 * ]);
 * 
 * const localManager = managers.get('local');
 * const remoteManager = managers.get('remote');
 * ```
 */
export function createMultipleServiceManagers(
  configs: Array<{ name: string; config: IServiceManagerConfig }>
): Map<string, ServiceManager.IManager> {
  const managers = new Map<string, ServiceManager.IManager>();
  
  for (const { name, config } of configs) {
    managers.set(name, createServiceManager(config));
  }
  
  return managers;
}

/**
 * Example configurations for common Jupyter setups
 */
export const EXAMPLE_CONFIGS = {
  /**
   * Default local Jupyter notebook server
   */
  LOCAL_JUPYTER: {
    baseUrl: 'http://localhost:8888',
    token: '',
  },
  
  /**
   * JupyterHub single-user server
   */
  JUPYTERHUB_USER: {
    baseUrl: '/user/username',
    token: '',
    appendToken: false,
  },
  
  /**
   * Binder service
   */
  BINDER: {
    baseUrl: 'https://mybinder.org',
    token: '',
  },
  
  /**
   * CoCalc Jupyter
   */
  COCALC: {
    baseUrl: 'https://cocalc.com/api/jupyter',
    token: '',
  },
  
  /**
   * Google Colab (requires additional auth)
   */
  COLAB: {
    baseUrl: 'https://colab.research.google.com',
    token: '',
  },
};