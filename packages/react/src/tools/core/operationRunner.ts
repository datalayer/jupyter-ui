/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Operation runner that executes operations and applies formatting.
 *
 * @module tools/core/operationRunner
 */

import type { ToolOperation, ToolExecutionContext } from './interfaces';
import { formatResponse } from './formatter';

/**
 * Executes tool operations and applies formatting to results.
 *
 * Operations return pure typed data. The runner applies formatting
 * based on context.format:
 * - 'json' → Returns structured object (TResult)
 * - 'toon' → Returns TOON-encoded string
 */
export class OperationRunner {
  /**
   * Execute an operation and format its result.
   *
   * @template TParams - Operation parameter type
   * @template TResult - Operation result type
   * @param operation - Tool operation to execute
   * @param params - Operation parameters
   * @param context - Execution context
   * @returns Formatted result (object or string based on context.format)
   */
  async execute<TParams, TResult>(
    operation: ToolOperation<TParams, TResult>,
    params: TParams,
    context: ToolExecutionContext
  ): Promise<TResult | string> {
    // Execute operation (returns pure typed data)
    const result = await operation.execute(params, context);

    // Apply formatting based on context.format
    return formatResponse(result, context.format);
  }
}
