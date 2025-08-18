/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { YNotebook } from '@jupyter/ydoc';
import { WebsocketProvider } from 'y-websocket';
import { IDisposable } from '@lumino/disposable';
import { ISignal, Signal } from '@lumino/signaling';

/**
 * Collaboration provider connection status
 */
export enum CollaborationStatus {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Error = 'error',
}

/**
 * Events emitted by collaboration providers
 */
export interface ICollaborationProviderEvents {
  /**
   * Signal emitted when connection status changes
   */
  statusChanged: ISignal<ICollaborationProvider, CollaborationStatus>;
  /**
   * Signal emitted when an error occurs
   */
  errorOccurred: ISignal<ICollaborationProvider, Error>;
  /**
   * Signal emitted when synchronization state changes
   */
  syncStateChanged: ISignal<ICollaborationProvider, boolean>;
}

/**
 * Interface for collaboration providers
 *
 * This interface defines the contract that all collaboration providers must implement.
 * It provides a uniform way to connect to different collaboration backends while
 * maintaining the same API for the notebook components.
 */
export interface ICollaborationProvider extends IDisposable {
  /**
   * Provider type identifier
   */
  readonly type: string;

  /**
   * Current connection status
   */
  readonly status: CollaborationStatus;

  /**
   * Whether the provider is currently connected
   */
  readonly isConnected: boolean;

  /**
   * Provider events
   */
  readonly events: ICollaborationProviderEvents;

  /**
   * Connect to the collaboration service
   *
   * @param sharedModel - The shared notebook model
   * @param documentId - Document identifier
   * @param options - Additional connection options
   * @returns Promise that resolves when connected
   */
  connect(
    sharedModel: YNotebook,
    documentId: string,
    options?: Record<string, any>
  ): Promise<void>;

  /**
   * Disconnect from the collaboration service
   */
  disconnect(): void;

  /**
   * Get the underlying WebSocket provider
   *
   * @returns The WebSocket provider or null if not connected
   */
  getProvider(): WebsocketProvider | null;

  /**
   * Get the shared model
   *
   * @returns The shared model or null if not connected
   */
  getSharedModel(): YNotebook | null;

  /**
   * Handle connection close event
   *
   * @param event - Close event
   */
  handleConnectionClose(event: CloseEvent): void;

  /**
   * Handle synchronization event
   *
   * @param isSynced - Whether the document is synchronized
   */
  handleSync(isSynced: boolean): void;
}

/**
 * Abstract base class for collaboration providers
 *
 * This class provides common functionality for all collaboration providers.
 */
export abstract class CollaborationProviderBase
  implements ICollaborationProvider
{
  protected _status: CollaborationStatus = CollaborationStatus.Disconnected;
  protected _provider: WebsocketProvider | null = null;
  protected _sharedModel: YNotebook | null = null;
  protected _statusChanged = new Signal<this, CollaborationStatus>(this);
  protected _errorOccurred = new Signal<this, Error>(this);
  protected _syncStateChanged = new Signal<this, boolean>(this);
  protected _isDisposed = false;

  constructor(public readonly type: string) {}

  get status(): CollaborationStatus {
    return this._status;
  }

  get isConnected(): boolean {
    return this._status === CollaborationStatus.Connected;
  }

  get isDisposed(): boolean {
    return this._isDisposed;
  }

  get events(): ICollaborationProviderEvents {
    return {
      statusChanged: this._statusChanged,
      errorOccurred: this._errorOccurred,
      syncStateChanged: this._syncStateChanged,
    };
  }

  abstract connect(
    sharedModel: YNotebook,
    documentId: string,
    options?: Record<string, any>
  ): Promise<void>;

  disconnect(): void {
    if (this._provider) {
      this._provider.disconnect();
      this._provider.destroy();
      this._provider = null;
    }
    this._sharedModel = null;
    this.setStatus(CollaborationStatus.Disconnected);
  }

  getProvider(): WebsocketProvider | null {
    return this._provider;
  }

  getSharedModel(): YNotebook | null {
    return this._sharedModel;
  }

  handleConnectionClose(event: CloseEvent): void {
    if (event.code > 1000) {
      console.error('Connection closed unexpectedly:', event);
      this.setStatus(CollaborationStatus.Error);
      this._errorOccurred.emit(new Error(`Connection closed: ${event.reason}`));
    }
  }

  handleSync(isSynced: boolean): void {
    this._syncStateChanged.emit(isSynced);
    if (isSynced) {
      this.setStatus(CollaborationStatus.Connected);
    }
  }

  dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this.disconnect();
    Signal.clearData(this);
    this._isDisposed = true;
  }

  protected setStatus(status: CollaborationStatus): void {
    if (this._status !== status) {
      this._status = status;
      this._statusChanged.emit(status);
    }
  }
}
