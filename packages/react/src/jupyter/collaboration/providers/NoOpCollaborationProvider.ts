/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { YNotebook } from '@jupyter/ydoc';
import { WebsocketProvider } from 'y-websocket';
import {
  CollaborationProviderBase,
  CollaborationStatus,
} from '../ICollaborationProvider';

/**
 * Configuration for no-op collaboration provider
 */
export interface INoOpCollaborationConfig {
  type?: 'none' | 'noop';
}

/**
 * No-operation collaboration provider
 *
 * This provider is used when collaboration is disabled.
 * It provides a null implementation of the collaboration interface.
 */
export class NoOpCollaborationProvider extends CollaborationProviderBase {
  constructor(config?: INoOpCollaborationConfig) {
    super('none');
  }

  async connect(
    sharedModel: YNotebook,
    documentId: string,
    options?: Record<string, any>
  ): Promise<void> {
    // No-op: Just store the shared model without creating any connection
    this._sharedModel = sharedModel;
    this.setStatus(CollaborationStatus.Connected);
    this._syncStateChanged.emit(true);
  }

  disconnect(): void {
    this._sharedModel = null;
    this.setStatus(CollaborationStatus.Disconnected);
  }

  getProvider(): WebsocketProvider | null {
    // No WebSocket provider in no-op mode
    return null;
  }

  handleConnectionClose(event: CloseEvent): void {
    // No-op: No connection to close
  }

  handleSync(isSynced: boolean): void {
    // No-op: Always considered synced
    this._syncStateChanged.emit(true);
  }
}
