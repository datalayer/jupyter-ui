/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Run all blocks operation for Lexical documents
 *
 * @module tools/core/operations/runAllBlocks
 */

import type {
  ToolOperation,
  LexicalExecutionContext,
} from '../core/interfaces';
import { formatResponse } from '../core/formatter';

/**
 * Parameters for running all blocks in a Lexical document
 * Empty object type - reserved for future extensibility (e.g., filters, execution order)
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RunAllBlocksParams {
  // Empty for now - reserved for future extensibility (e.g., filters, execution order)
}

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
 * Validates RunAllBlocksParams at runtime.
 */
function isRunAllBlocksParams(params: unknown): params is RunAllBlocksParams {
  // RunAllBlocksParams is currently empty, so just check it's an object
  if (typeof params !== 'object' || params === null) {
    return false;
  }
  return true;
}

/**
 * Run all blocks operation - executes all executable blocks in a Lexical document
 *
 * Runs all executable blocks (jupyter-cell, code blocks with executable: true) in sequence.
 * Only executable blocks are run; other block types are skipped.
 *
 * Uses lexicalId as the universal identifier (matches Lexical component).
 */
export const runAllBlocksOperation: ToolOperation<
  RunAllBlocksParams,
  RunAllBlocksResult
> = {
  name: 'runAllBlocks',

  async execute(
    params: unknown,
    context: LexicalExecutionContext,
  ): Promise<RunAllBlocksResult> {
    // Validate params using type guard
    if (!isRunAllBlocksParams(params)) {
      throw new Error(
        `Invalid parameters for runAllBlocks. Expected empty object {}. ` +
          `Received: ${JSON.stringify(params)}`,
      );
    }

    // Now TypeScript knows params is RunAllBlocksParams!
    const { lexicalId } = context;

    // Validate context
    if (!lexicalId) {
      throw new Error(
        'Lexical ID is required for runAllBlocks operation. ' +
          'Ensure the tool execution context includes a valid lexicalId.',
      );
    }

    // Ensure executeCommand is available
    if (!context.executeCommand) {
      throw new Error(
        'executeCommand callback is required for runAllBlocks operation.',
      );
    }

    try {
      // Call internal command with URI (VS Code-specific requirement)
      const executedCount = await context.executeCommand<number>(
        'lexical.runAllBlocks',
        {
          lexicalId,
        },
      );

      return formatResponse(
        {
          success: true,
          executedCount,
        },
        context.format,
      ) as RunAllBlocksResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to run all blocks: ${errorMessage}`);
    }
  },
};
