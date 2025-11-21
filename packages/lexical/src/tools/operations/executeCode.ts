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
import { validateWithZod } from '../core/zodUtils';
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
    context: LexicalExecutionContext,
  ): Promise<ExecuteCodeResult> {
    console.log('[executeCodeOperation] Called with params:', params);
    console.log('[executeCodeOperation] Context:', {
      lexicalId: context.lexicalId,
      hasExecutor: !!context.executor,
    });

    // Validate params using Zod
    const validatedParams = validateWithZod(
      executeCodeParamsSchema,
      params,
      'executeCode',
    );

    console.log('[executeCodeOperation] Validated params:', validatedParams);

    const { lexicalId } = context;

    if (!lexicalId) {
      return {
        success: false,
        error: 'Lexical ID is required for this operation.',
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
      const result = await context.executor.execute<ExecuteCodeResult>(
        this.name,
        validatedParams,
      );

      console.log('[executeCodeOperation] Executor result:', result);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to execute code: ${errorMessage}`);
    }
  },
};
