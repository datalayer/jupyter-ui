/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { ServerConnection } from "@jupyterlab/services";

export type IJupyterCollaborationServer = {
  /**
   * Base server URL
   */
  baseURL: string;
  /**
   * Notebook room name to connect to.
   */
  roomName: string;
  /**
   * JWT token
   */
  token: string;
  /**
   * Server type
   */
  type: 'datalayer';
}

export type IDatalayerCollaborationServer = {
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

export type ICollaborationServer = IJupyterCollaborationServer | IDatalayerCollaborationServer;

export type ICollaborationProvider = 'jupyter' | 'datalayer' | undefined;

export default ICollaborationProvider;
