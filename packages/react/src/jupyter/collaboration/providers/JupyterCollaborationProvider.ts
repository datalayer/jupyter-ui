/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { YNotebook } from '@jupyter/ydoc';
import { WebsocketProvider } from 'y-websocket';
import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';
import {
  CollaborationProviderBase,
  CollaborationStatus,
} from '../ICollaborationProvider';
import {
  COLLABORATION_ROOM_URL_PATH,
  requestJupyterCollaborationSession,
} from '../JupyterCollaboration';

/**
 * Configuration for Jupyter collaboration provider
 */
export interface IJupyterCollaborationConfig {
  /**
   * Notebook file path (optional - can be provided via connect options)
   */
  path?: string;
  /**
   * Server settings
   */
  serverSettings?: ServerConnection.ISettings;
  /**
   * Format of the document
   */
  format?: string;
  /**
   * Type of the document
   */
  documentType?: string;
}

/**
 * Jupyter collaboration provider
 *
 * This provider connects to Jupyter's collaboration service using WebSockets.
 */
export class JupyterCollaborationProvider extends CollaborationProviderBase {
  private _config: IJupyterCollaborationConfig;
  private _onSync: ((isSynced: boolean) => void) | null = null;
  private _onConnectionClose: ((event: CloseEvent) => void) | null = null;

  constructor(config: IJupyterCollaborationConfig = {}) {
    super('jupyter');
    this._config = config;
  }

  async connect(
    sharedModel: YNotebook,
    documentId: string,
    options?: Record<string, any>
  ): Promise<void> {
    if (this.isConnected) {
      console.warn('Already connected to Jupyter collaboration service');
      return;
    }

    this.setStatus(CollaborationStatus.Connecting);

    try {
      const serverSettings =
        this._config.serverSettings ?? ServerConnection.makeSettings();
      const { ydoc, awareness } = sharedModel;

      // Use path from options if provided, otherwise fall back to config
      const path = options?.path || this._config.path;
      if (!path) {
        throw new Error(
          'Path is required for Jupyter collaboration. Provide it in the config or via connect options.'
        );
      }

      // Request collaboration session from Jupyter
      const session = await requestJupyterCollaborationSession(
        this._config.format || 'json',
        this._config.documentType || 'notebook',
        path,
        serverSettings
      );

      // Build WebSocket URL
      const wsUrl = serverSettings.wsUrl;
      if (!wsUrl) {
        throw new Error('WebSocket URL is not available');
      }
      const documentURL = URLExt.join(wsUrl, COLLABORATION_ROOM_URL_PATH);
      const documentName = `${session.format}:${session.type}:${session.fileId}`;

      // Create WebSocket provider
      const params: Record<string, string> = {
        sessionId: session.sessionId,
      };
      if (serverSettings.token) {
        params.token = serverSettings.token;
      }

      this._provider = new WebsocketProvider(documentURL, documentName, ydoc, {
        disableBc: true,
        params,
        awareness,
        ...options,
      });

      this._sharedModel = sharedModel;

      // Set up event handlers
      this._onSync = (isSynced: boolean) => {
        this.handleSync(isSynced);
      };
      this._onConnectionClose = (event: CloseEvent) => {
        this.handleConnectionClose(event);
      };

      this._provider.on('sync', this._onSync);
      this._provider.on('connection-close', this._onConnectionClose);

      console.log('Connected to Jupyter collaboration service');
    } catch (error) {
      this.setStatus(CollaborationStatus.Error);
      this._errorOccurred.emit(error as Error);
      throw error;
    }
  }

  disconnect(): void {
    if (this._provider) {
      if (this._onSync) {
        this._provider.off('sync', this._onSync);
      }
      if (this._onConnectionClose) {
        this._provider.off('connection-close', this._onConnectionClose);
      }
    }
    super.disconnect();
  }

  handleConnectionClose(event: CloseEvent): void {
    super.handleConnectionClose(event);

    // Handle session expiration (code 4002)
    if (event.code === 4002) {
      console.warn('Jupyter collaboration session expired');
      // Attempt to reconnect could be implemented here?
    }
  }
}
