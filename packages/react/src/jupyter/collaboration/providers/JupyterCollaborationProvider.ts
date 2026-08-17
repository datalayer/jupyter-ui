/*
 * Copyright (c) 2021-Present Datalayer, Inc.
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
  /** What `connect` was called with, for a session-expiry reconnection. */
  private _connection: {
    sharedModel: YNotebook;
    documentId: string;
    options?: Record<string, any>;
  } | null = null;
  /** Expired sessions renewed in a row without a successful sync. */
  private _sessionRenewals = 0;

  constructor(config: IJupyterCollaborationConfig = {}) {
    super('jupyter');
    this._config = config;
  }

  async connect(
    sharedModel: YNotebook,
    documentId: string,
    options?: Record<string, any>
  ): Promise<void> {
    // Guard against a second connection on the same provider instance.
    // A provider may be shared by multiple notebook views (e.g. two panes of
    // the same collaborative document in a single tab). Without also guarding
    // the `Connecting` state and an already-created provider, a race between
    // the two near-simultaneous `connect()` calls would open two websockets to
    // the same room in the same tab, which floods the awareness/sync channel
    // and freezes the browser. Collapsing to a single live connection avoids it.
    if (
      this.isConnected ||
      this._status === CollaborationStatus.Connecting ||
      this._provider
    ) {
      console.warn('Already connected to Jupyter collaboration service');
      return;
    }

    this.setStatus(CollaborationStatus.Connecting);
    this._connection = { sharedModel, documentId, options };

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
        /*
         * The identity of the room, stated in the document itself.
         *
         * The native RTC provider of JupyterLab stamps the room name into the
         * ystate as `document_id`; server-side executors —
         * jupyter-server-nbmodel — look the shared document up by it when the
         * session path does not name a file of the server, which is the case
         * for every editor of Datalayer (their session carries a placeholder
         * path). Without this, the server cannot find the document and the
         * outputs of a server-side execution are written nowhere.
         *
         * Stamped only once the room has synced: a document that names a room
         * is a promise that the server reaches this very editor through it,
         * and a connection that never synced keeps that promise unmade — the
         * executors then fall back to running the cells in the browser rather
         * than writing outputs into a room nobody displays.
         */
        if (isSynced) {
          // The room answers again: any renewed session did its job.
          this._sessionRenewals = 0;
          try {
            ydoc.getMap('state').set('document_id', documentName);
          } catch (reason) {
            console.warn(
              'Failed to record the collaboration room id in the shared document.',
              reason
            );
          }
        }
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
    this._connection = null;
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

    /*
     * The session expired: the server answers 4002 and will keep answering
     * it, because the websocket reconnects with the sessionId it was created
     * with. Left alone, an editor that outlives its session keeps its stamp,
     * its content and its delegation — and silently stops receiving what the
     * server writes: the outputs of a server-side execution then only show
     * when the execution completes. The session is renewed instead: a fresh
     * sessionId over the same shared document, invisible to the user.
     */
    if (event.code === 4002) {
      const renewal = (this._sessionRenewals += 1);
      if (!this._connection || renewal > 5) {
        console.warn(
          'Jupyter collaboration session expired and was not renewed.'
        );
        return;
      }
      const { sharedModel, documentId, options } = this._connection;
      console.info(
        `Jupyter collaboration session expired: renewing it (attempt ${renewal}).`
      );
      // Retire the websocket of the expired session entirely — its own
      // reconnection loop would keep knocking with the stale sessionId.
      if (this._provider) {
        if (this._onSync) {
          this._provider.off('sync', this._onSync);
        }
        if (this._onConnectionClose) {
          this._provider.off('connection-close', this._onConnectionClose);
        }
        this._provider.destroy();
        this._provider = null;
      }
      this.setStatus(CollaborationStatus.Disconnected);
      // A renewal against a restarting server needs a moment; renewals that
      // keep failing wait longer each time, and give up above.
      const delay = Math.min(500 * 2 ** (renewal - 1), 8000);
      setTimeout(() => {
        // The editor may have let go of the document in the meantime.
        if (this._connection?.sharedModel !== sharedModel) {
          return;
        }
        this._connection = null;
        this.connect(sharedModel, documentId, options).catch(reason => {
          console.error(
            'Failed to renew the expired Jupyter collaboration session.',
            reason
          );
        });
      }, delay);
    }
  }
}
