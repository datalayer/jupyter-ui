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

import type { ToolOperation, ToolExecutionContext } from '../core/interfaces';
import { validateWithZod } from '@datalayer/jupyter-react/lib/tools/core/zodUtils';
import {
  executeCodeParamsSchema,
  type ExecuteCodeParams,
} from '../schemas/executeCode';

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
    context: ToolExecutionContext,
  ): Promise<ExecuteCodeResult> {
    console.log('[executeCodeOperation] Called with params:', params);
    console.log('[executeCodeOperation] Context:', {
      documentId: context.documentId,
      hasExecutor: !!context.executor,
    });

    // Validate params using Zod
    const validatedParams = validateWithZod(
      executeCodeParamsSchema as any,
      params,
      'executeCode',
    ) as ExecuteCodeParams;

    console.log('[executeCodeOperation] Validated params:', validatedParams);

    const { documentId } = context;

    if (!documentId) {
      return {
        success: false,
        error: 'Document ID is required for this operation.',
      };
    }

    // Ensure executor is available
    if (!context.executor) {
      throw new Error(
        'Executor is required for executeCode operation. ' +
          'This should be provided by the platform (DefaultExecutor, BridgeExecutor, etc.)',
      );
    }

    try {
      console.log('[executeCodeOperation] Calling executor.execute with:', {
        operationName: this.name,
        validatedParams,
      });

      // Call executor (uses this.name for DRY principle)
      const result = (await context.executor.execute(
        this.name,
        validatedParams,
      )) as ExecuteCodeResult;

      console.log('[executeCodeOperation] Executor result:', result);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to execute code: ${errorMessage}`);
    }
  },
};
