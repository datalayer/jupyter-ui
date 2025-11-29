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
import type { ToolExecutionContext } from '@datalayer/jupyter-react';

// Re-export types for convenience
export type { LexicalBlock, LexicalMetadata, RegisteredNodeInfo };
export type { ToolExecutionContext };

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
   * @param context - Execution context (documentId, executor, SDK, auth)
   * @returns Operation result
   * @throws Error if operation fails
   */
  execute(params: TParams, context: ToolExecutionContext): Promise<TResult>;
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
