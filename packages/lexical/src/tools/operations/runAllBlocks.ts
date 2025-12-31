/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Run all blocks operation for Lexical documents
 *
 * @module tools/core/operations/runAllBlocks
 */

import type { ToolOperation, ToolExecutionContext } from '../core/interfaces';
import { validateWithZod } from '@datalayer/jupyter-react';
import {
  runAllBlocksParamsSchema,
  type RunAllBlocksParams,
} from '../schemas/runAllBlocks';

/**
 * Result of running all blocks
 */
export interface RunAllBlocksResult {
  /** Whether the operation succeeded */
  success: boolean;

  /** Number of blocks that were executed */
  executedCount?: number;

  /** Error message if operation failed */
  error?: string;
}

/**
 * Run all blocks operation - executes all executable blocks in a Lexical document
 *
 * Runs all executable blocks (jupyter-cell, code blocks with executable: true) in sequence.
 * Only executable blocks are run; other block types are skipped.
 *
 * Uses documentId as the universal identifier (matches Lexical component).
 */
export const runAllBlocksOperation: ToolOperation<
  RunAllBlocksParams,
  RunAllBlocksResult
> = {
  name: 'runAllBlocks',

  async execute(
    params: unknown,
    context: ToolExecutionContext,
  ): Promise<RunAllBlocksResult> {
    // Validate params using Zod
    validateWithZod(
      runAllBlocksParamsSchema as any,
      params || {},
      'runAllBlocks',
    );

    const { documentId } = context;

    // Validate context
    if (!documentId) {
      throw new Error(
        'Document ID is required for runAllBlocks operation. ' +
          'Ensure the tool execution context includes a valid documentId.',
      );
    }

    // Ensure executor is available
    if (!context.executor) {
      throw new Error(
        'Executor is required for runAllBlocks operation. ' +
          'This should be provided by the platform (DefaultExecutor, BridgeExecutor, etc.)',
      );
    }

    try {
      // Call executor (uses this.name for DRY principle)
      const executedCount = (await context.executor.execute(
        this.name,
        {},
      )) as number;

      return {
        success: true,
        executedCount,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to run all blocks: ${errorMessage}`);
    }
  },
};
