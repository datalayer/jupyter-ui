/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ServiceManager, ServerConnection } from '@jupyterlab/services';

/**
 * Interface for the ServiceManager context
 */
export interface IServiceManagerContext {
  serviceManager: ServiceManager.IManager | null;
  isReady: boolean;
  error: Error | null;
  setServiceManager: (sm: ServiceManager.IManager) => void;
}

/**
 * ServiceManager Context
 */
const ServiceManagerContext = createContext<IServiceManagerContext | undefined>(undefined);

/**
 * ServiceManager Provider Props
 */
export interface IServiceManagerProviderProps {
  children: ReactNode;
  serverUrl?: string;
  token?: string;
  wsUrl?: string;
  appendToken?: boolean;
  init?: boolean;
}

/**
 * ServiceManager Provider Component
 * 
 * Provides a JupyterLab ServiceManager instance to child components.
 * Can be configured with custom server settings or will use defaults.
 * 
 * @example
 * ```tsx
 * <ServiceManagerProvider serverUrl="http://localhost:8888" token="mytoken">
 *   <YourApp />
 * </ServiceManagerProvider>
 * ```
 */
export const ServiceManagerProvider: React.FC<IServiceManagerProviderProps> = ({
  children,
  serverUrl = 'http://localhost:8888',
  token = '',
  wsUrl,
  appendToken = true,
  init = true
}) => {
  const [serviceManager, setServiceManager] = useState<ServiceManager.IManager | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!init) {
      return;
    }

    try {
      // Create server settings
      const serverSettings = ServerConnection.makeSettings({
        baseUrl: serverUrl,
        wsUrl: wsUrl || serverUrl.replace(/^http/, 'ws'),
        token,
        appendToken,
      });

      // Create service manager
      const sm = new ServiceManager({ serverSettings });

      // Wait for service manager to be ready
      sm.ready
        .then(() => {
          setServiceManager(sm);
          setIsReady(true);
          console.log('ServiceManager is ready', sm);
        })
        .catch((err) => {
          console.error('Failed to initialize ServiceManager:', err);
          setError(err);
        });

      // Cleanup on unmount
      return () => {
        sm.dispose();
      };
    } catch (err) {
      console.error('Error creating ServiceManager:', err);
      setError(err as Error);
    }
  }, [serverUrl, token, wsUrl, appendToken, init]);

  const contextValue: IServiceManagerContext = {
    serviceManager,
    isReady,
    error,
    setServiceManager,
  };

  return (
    <ServiceManagerContext.Provider value={contextValue}>
      {children}
    </ServiceManagerContext.Provider>
  );
};

/**
 * Hook to use the ServiceManager context
 * 
 * @example
 * ```tsx
 * const { serviceManager, isReady } = useServiceManager();
 * 
 * useEffect(() => {
 *   if (isReady && serviceManager) {
 *     // Use the service manager
 *     const sessions = serviceManager.sessions;
 *   }
 * }, [isReady, serviceManager]);
 * ```
 */
export const useServiceManager = (): IServiceManagerContext => {
  const context = useContext(ServiceManagerContext);
  if (!context) {
    throw new Error('useServiceManager must be used within a ServiceManagerProvider');
  }
  return context;
};