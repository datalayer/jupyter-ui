/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Core interfaces for platform-agnostic tool operations.
 *
 * @module tools/core/interfaces
 */

import type { ToolExecutor } from './executor';

/**
 * Execution context for tool operations.
 */
export interface ToolExecutionContext {
  /** Tool executor (DefaultExecutor, BridgeExecutor, etc.) */
  executor: ToolExecutor;

  /** Document identifier - universal for notebooks, lexicals, etc. (file URI or document UID) */
  documentId?: string;

  /** Response format: "json" (default) or "toon" */
  format?: 'json' | 'toon';

  /** Platform-specific additional context */
  extras?: Record<string, unknown>;
}

/**
 * Platform-agnostic tool operation interface.
 *
 * @template TParams - Tool parameter type
 * @template TResult - Tool result type
 */
export interface ToolOperation<TParams, TResult> {
  /** Operation name (matches ToolDefinition.operation field) */
  name: string;

  /**
   * Execute the operation.
   *
   * @param params - Tool parameters
   * @param context - Execution context
   * @returns Operation result
   */
  execute(params: TParams, context: ToolExecutionContext): Promise<TResult>;
}

// Re-export ToolExecutor for convenience
export type { ToolExecutor };
