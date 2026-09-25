/*
 * Copyright (c) 2021-Present Datalayer, Inc.
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
import { ServiceManager } from '@jupyterlab/services';

/**
 * Configuration passed down to Lexical plugins
 */
export interface LexicalConfig {
  /** Unique identifier for this Lexical document */
  lexicalId: string;
  /** Service manager for kernel operations (optional) */
  serviceManager?: ServiceManager.IManager;
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
 * The configuration if there is any, rather than an error if there is not.
 *
 * A plugin that contributes tools needs to know which document it is part of,
 * and the answer is legitimately "none": an editor mounted without an `id` is
 * not addressable by an agent, so there is nothing to register against. That
 * is a reason to do nothing, not a reason to throw — which is what
 * `useLexicalConfig` would do, taking the editor down with it.
 */
export function useOptionalLexicalConfig(): LexicalConfig | undefined {
  return useContext(LexicalConfigContext);
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
  serviceManager?: ServiceManager.IManager;
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
