/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { ServiceManager } from '@jupyterlab/services';
import { WebsocketProvider as YWebsocketProvider } from 'y-websocket';

/**
 * Options for creating a collaboration provider
 */
export interface ICollaborationOptions {
  /** The Y.js document */
  ydoc: any;
  /** The awareness instance */
  awareness: any;
  /** The notebook path */
  path: string;
  /** Optional service manager */
  serviceManager?: ServiceManager.IManager;
  /** Optional authentication token */
  token?: string;
  /** Allow provider-specific options */
  [key: string]: any;
}

/**
 * Interface that all collaboration provider implementations must implement
 */
export interface ICollaborationProviderImpl {
  /** Unique name for this collaboration provider */
  readonly name: string;

  /**
   * Create and configure a websocket provider for collaboration
   * @param options - Configuration options for the provider
   * @returns Promise that resolves to a configured YWebsocketProvider
   */
  createProvider(options: ICollaborationOptions): Promise<YWebsocketProvider>;
}