/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Core interfaces for Lexical tool operations.
 * These interfaces enable platform-agnostic tool execution.
 *
 * @module tools/core/interfaces
 */

import type {
  LexicalBlock,
  LexicalMetadata,
  RegisteredNodeInfo,
} from './types';

// Re-export types for convenience
export type { LexicalBlock, LexicalMetadata, RegisteredNodeInfo };

/**
 * Base tool execution context - common to all operations
 */
export interface BaseExecutionContext {
  /**
   * Datalayer SDK for API operations
   * (Required for notebook/runtime creation tools)
   */
  sdk?: unknown; // DatalayerClient (avoid circular import)

  /**
   * Authentication provider
   * (Required for authenticated operations)
   */
  auth?: unknown; // AuthProvider (avoid circular import)

  /**
   * Response format for tool results
   * - "json": Standard JSON format (default) - structured data
   * - "toon": TOON format - human/LLM-readable with compact syntax
   */
  format?: 'json' | 'toon';

  /**
   * Platform-agnostic command execution callback.
   * Allows operations to invoke platform-specific commands without direct dependencies.
   *
   * Operations call this with namespaced command names (e.g., "notebook.insertCell", "lexical.insertBlock").
   * The platform adapter is responsible for mapping these to the appropriate implementation.
   *
   * @param command - Command name with namespace prefix (e.g., "notebook.insertCell")
   * @param args - Command arguments (platform adapter handles any necessary conversions)
   * @returns Command result
   */
  executeCommand?: <T = void>(command: string, args: unknown) => Promise<T>;

  /**
   * Platform-specific extras (escape hatch for special cases)
   * Use this to pass additional context that doesn't fit in the standard interface.
   */
  extras?: Record<string, unknown>;
}

/**
 * Lexical-specific execution context
 * Used by all Lexical block operations (insertBlock, deleteBlock, readBlocks)
 */
export interface LexicalExecutionContext extends BaseExecutionContext {
  /**
   * Lexical document ID - universal identifier for both local and remote documents
   * - Local documents: Same as file URI (e.g., "file:///path/to/document.lexical")
   * - Remote documents: Datalayer document UID (e.g., "01KAJ42KE2XKM7NBNZV568KXQX")
   */
  lexicalId: string;
}

/**
 * Core tool operation interface - platform agnostic.
 *
 * All tool operations implement this interface, enabling them to work
 * identically across VS Code, SaaS, and ag-ui platforms.
 *
 * @template TParams - Tool parameter type (input)
 * @template TResult - Tool result type (output)
 */
export interface ToolOperation<TParams, TResult> {
  /**
   * Unique operation name (used for registry lookup)
   * Must match the `operation` field in ToolDefinition that references this operation.
   */
  name: string;

  /**
   * Execute the operation with given parameters and context
   *
   * Note: Description, parameters schema, and other metadata are defined in the
   * ToolDefinition (schema), not here. Operations are pure implementation.
   *
   * @param params - Tool-specific parameters
   * @param context - Execution context (lexicalId, SDK, auth)
   * @returns Operation result
   * @throws Error if operation fails
   */
  execute(params: TParams, context: LexicalExecutionContext): Promise<TResult>;
}

/**
 * Tool operation registry interface
 *
 * Provides centralized access to all available operations.
 */
export interface ToolOperationRegistry {
  /**
   * Register a tool operation
   */
  register<TParams, TResult>(operation: ToolOperation<TParams, TResult>): void;

  /**
   * Get a tool operation by name
   */
  get<TParams, TResult>(
    name: string,
  ): ToolOperation<TParams, TResult> | undefined;

  /**
   * Check if an operation is registered
   */
  has(name: string): boolean;

  /**
   * Get all registered operation names
   */
  getAllNames(): string[];

  /**
   * Get all registered operations
   */
  getAll(): Array<ToolOperation<unknown, unknown>>;
}
