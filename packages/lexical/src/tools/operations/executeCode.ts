/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Platform-agnostic code execution operation for Lexical documents.
 * Executes code directly in the kernel without creating or modifying blocks.
 *
 * @module tools/operations/executeCode
 */

import type {
  ToolOperation,
  LexicalExecutionContext,
} from '../core/interfaces';
import { formatResponse } from '../core/formatter';

/**
 * Parameters for executeCode operation.
 */
export interface ExecuteCodeParams {
  /** Code to execute */
  code: string;

  /** Whether to store in kernel history (default: false) */
  storeHistory?: boolean;

  /** Silent execution - no output displayed (default: false) */
  silent?: boolean;

  /** Stop execution on error (default: true) */
  stopOnError?: boolean;
}

/**
 * Validates ExecuteCodeParams at runtime.
 */
function isExecuteCodeParams(params: unknown): params is ExecuteCodeParams {
  if (typeof params !== 'object' || params === null) {
    return false;
  }

  const p = params as Record<string, unknown>;

  // code is required and must be a string
  if (typeof p.code !== 'string') {
    return false;
  }

  // Optional boolean fields
  if (p.storeHistory !== undefined && typeof p.storeHistory !== 'boolean') {
    return false;
  }
  if (p.silent !== undefined && typeof p.silent !== 'boolean') {
    return false;
  }
  if (p.stopOnError !== undefined && typeof p.stopOnError !== 'boolean') {
    return false;
  }

  return true;
}

/**
 * Result from executeCode operation.
 */
export interface ExecuteCodeResult {
  success: boolean;
  /** Execution outputs (streams, results, errors) */
  outputs?: Array<{
    type: 'stream' | 'execute_result' | 'display_data' | 'error';
    content: unknown;
  }>;
  /** Error message if execution failed */
  error?: string;
  /** Execution count (if stored in history) */
  executionCount?: number;
}

/**
 * Executes code directly in the kernel without creating a block.
 *
 * This is useful for:
 * - Variable inspection
 * - Environment setup
 * - Background tasks
 * - Tool introspection
 */
export const executeCodeOperation: ToolOperation<
  ExecuteCodeParams,
  ExecuteCodeResult
> = {
  name: 'executeCode',

  async execute(
    params: unknown,
    context: LexicalExecutionContext,
  ): Promise<ExecuteCodeResult> {
    // Validate params using type guard
    if (!isExecuteCodeParams(params)) {
      throw new Error(
        `Invalid parameters for executeCode. Expected { code: string, storeHistory?: boolean, silent?: boolean, stopOnError?: boolean }. ` +
          `Received: ${JSON.stringify(params)}`,
      );
    }

    const { lexicalId } = context;

    if (!lexicalId) {
      return formatResponse(
        {
          success: false,
          error: 'Lexical ID is required for this operation.',
        },
        context.format,
      ) as ExecuteCodeResult;
    }

    // Ensure executeCommand is available
    if (!context.executeCommand) {
      throw new Error(
        'executeCommand callback is required for executeCode operation. ' +
          'This should be provided by the platform adapter.',
      );
    }

    try {
      // Call internal command to execute code directly in kernel
      const result = await context.executeCommand<ExecuteCodeResult>(
        'lexical.executeCode',
        {
          lexicalId,
          ...params,
        },
      );

      return formatResponse(result, context.format) as ExecuteCodeResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to execute code: ${errorMessage}`);
    }
  },
};
