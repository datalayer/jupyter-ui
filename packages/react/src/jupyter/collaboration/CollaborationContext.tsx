/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { YNotebook } from '@jupyter/ydoc';
import {
  ICollaborationProvider,
  CollaborationStatus,
} from './ICollaborationProvider';

/**
 * Collaboration context value
 */
export interface ICollaborationContext {
  /**
   * The collaboration provider instance
   */
  provider: ICollaborationProvider | null;
  /**
   * Current connection status
   */
  status: CollaborationStatus;
  /**
   * Whether the provider is connected
   */
  isConnected: boolean;
  /**
   * Whether the document is synchronized
   */
  isSynced: boolean;
  /**
   * Error if any
   */
  error: Error | null;
  /**
   * Connect to collaboration service
   */
  connect: (
    sharedModel: YNotebook,
    documentId: string,
    options?: Record<string, any>
  ) => Promise<void>;
  /**
   * Disconnect from collaboration service
   */
  disconnect: () => void;
}

const CollaborationContext = createContext<ICollaborationContext | undefined>(
  undefined
);

/**
 * Props for CollaborationProvider component
 */
export interface ICollaborationProviderProps {
  /**
   * Collaboration provider instance
   */
  provider?: ICollaborationProvider;
  /**
   * Children components
   */
  children: React.ReactNode;
}

/**
 * Collaboration provider component
 *
 * This component provides collaboration context to its children.
 */
export function CollaborationProvider({
  provider: providerProp,
  children,
}: ICollaborationProviderProps): JSX.Element {
  const [status, setStatus] = useState<CollaborationStatus>(
    CollaborationStatus.Disconnected
  );
  const [isSynced, setIsSynced] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use the provider instance
  const provider = useMemo(() => {
    return providerProp || null;
  }, [providerProp]);

  // Subscribe to provider events
  useEffect(() => {
    if (!provider) {
      return;
    }

    const statusHandler = (
      sender: ICollaborationProvider,
      newStatus: CollaborationStatus
    ) => {
      setStatus(newStatus);
    };

    const errorHandler = (sender: ICollaborationProvider, error: Error) => {
      setError(error);
    };

    const syncHandler = (sender: ICollaborationProvider, synced: boolean) => {
      setIsSynced(synced);
    };

    provider.events.statusChanged.connect(statusHandler);
    provider.events.errorOccurred.connect(errorHandler);
    provider.events.syncStateChanged.connect(syncHandler);

    // Set initial status
    setStatus(provider.status);

    return () => {
      provider.events.statusChanged.disconnect(statusHandler);
      provider.events.errorOccurred.disconnect(errorHandler);
      provider.events.syncStateChanged.disconnect(syncHandler);
    };
  }, [provider]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      provider?.dispose();
    };
  }, [provider]);

  const connect = async (
    sharedModel: YNotebook,
    documentId: string,
    options?: Record<string, any>
  ): Promise<void> => {
    if (!provider) {
      throw new Error('No collaboration provider configured');
    }
    setError(null);
    try {
      await provider.connect(sharedModel, documentId, options);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const disconnect = (): void => {
    provider?.disconnect();
    setIsSynced(false);
    setError(null);
  };

  const value: ICollaborationContext = {
    provider,
    status,
    isConnected: status === CollaborationStatus.Connected,
    isSynced,
    error,
    connect,
    disconnect,
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
}

/**
 * Hook to use collaboration context
 *
 * @returns The collaboration context value
 * @throws Error if used outside of CollaborationProvider
 */
export function useCollaboration(): ICollaborationContext {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error(
      'useCollaboration must be used within a CollaborationProvider'
    );
  }
  return context;
}

/**
 * Hook to get collaboration status
 */
export function useCollaborationStatus(): CollaborationStatus {
  const { status } = useCollaboration();
  return status;
}

/**
 * Hook to check if collaboration is connected
 */
export function useIsCollaborationConnected(): boolean {
  const { isConnected } = useCollaboration();
  return isConnected;
}
