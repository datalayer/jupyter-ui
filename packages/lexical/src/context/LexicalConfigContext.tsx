/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Context for Lexical configuration (lexicalId).
 * Provides the lexicalId to child components and plugins.
 *
 * @module context/LexicalConfigContext
 */

import { createContext, useContext } from 'react';

/**
 * Configuration passed down to Lexical plugins
 */
export interface LexicalConfig {
  /** Unique identifier for this Lexical document */
  lexicalId: string;
  /** Service manager for kernel operations (optional) */
  serviceManager?: any;
}

/**
 * Context for Lexical configuration
 */
const LexicalConfigContext = createContext<LexicalConfig | undefined>(
  undefined,
);

/**
 * Hook to access Lexical configuration
 *
 * @throws {Error} If used outside of LexicalConfigProvider
 */
export function useLexicalConfig(): LexicalConfig {
  const config = useContext(LexicalConfigContext);
  if (!config) {
    throw new Error(
      'useLexicalConfig must be used within a LexicalConfigProvider',
    );
  }
  return config;
}

/**
 * Provider component for Lexical configuration
 *
 * @example
 * ```tsx
 * <LexicalConfigProvider lexicalId="doc-123" serviceManager={sm}>
 *   <Editor />
 * </LexicalConfigProvider>
 * ```
 */
export interface LexicalConfigProviderProps {
  lexicalId: string;
  serviceManager?: any;
  children: React.ReactNode;
}

export function LexicalConfigProvider({
  lexicalId,
  serviceManager,
  children,
}: LexicalConfigProviderProps) {
  return (
    <LexicalConfigContext.Provider value={{ lexicalId, serviceManager }}>
      {children}
    </LexicalConfigContext.Provider>
  );
}
