/*
 * Copyright (c) 2021-Present Datalayer, Inc.
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
    /*
     * Nothing is logged here.
     *
     * This used to print the operation, its parameters, the whole context and
     * the result on every single tool call. The context carries `extras`,
     * which is where platforms put their SDK handles and credentials, so the
     * logging was both unreadable and a place for a token to end up in a
     * browser console. A caller that wants to watch tool traffic can wrap the
     * executor, which sees the same calls without the context.
     */
    const result = await operation.execute(params, context);
    return formatResponse(result, context.format);
  }
}
