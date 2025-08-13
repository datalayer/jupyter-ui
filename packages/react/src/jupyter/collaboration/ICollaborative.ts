/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { ServerConnection } from "@jupyterlab/services";

/**
 * Generic Jupyter collaboration server configuration
 */
export type IJupyterCollaborationServer = {
  /**
   * Notebook path
   */
  path: string;
  /**
   * Jupyter server settings
   */
  serverSettings: ServerConnection.ISettings;
  /**
   * Server type
   */
  type: 'jupyter';
}

/**
 * Generic collaboration server type (jupyter-ui only supports Jupyter by default)
 * Extensions can provide additional collaboration types via the provider registry
 */
export type ICollaborationServer = IJupyterCollaborationServer;

/**
 * Generic collaboration provider type - accepts any provider name.
 * The CollaborationProviderRegistry validates provider availability at runtime.
 * 
 * Built-in providers:
 * - 'jupyter': Default Jupyter collaboration via JupyterLab collaboration server
 * 
 * Extensions can register additional providers via:
 * ```typescript
 * import { collaborationProviderRegistry } from '@datalayer/jupyter-react';
 * collaborationProviderRegistry.register('my-provider', new MyCollaborationProvider());
 * ```
 */
export type ICollaborationProvider = string | undefined;

export default ICollaborationProvider;
