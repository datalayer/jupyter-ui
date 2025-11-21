/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Platform-agnostic cell execution operation.
 *
 * @module tools/operations/runCell
 */

import type { ToolOperation, ToolExecutionContext } from '../core/interfaces';
import { formatResponse } from '../core/formatter';

/**
 * Parameters for runCell operation.
 */
export interface RunCellParams {
  /** Cell index to execute (optional, defaults to current) */
  index?: number;
}

/**
 * Validates RunCellParams at runtime.
 */
function isRunCellParams(params: unknown): params is RunCellParams {
  if (typeof params !== 'object' || params === null) {
    return false;
  }

  const p = params as Record<string, unknown>;
  return p.index === undefined || typeof p.index === 'number';
}

/**
 * Result from runCell operation.
 */
export interface RunCellResult {
  success: boolean;
  index?: number;
  message?: string;
  error?: string;
}

/**
 * Executes a cell and displays its output.
 */

export const runCellOperation: ToolOperation<RunCellParams, RunCellResult> = {
  name: 'runCell',

  async execute(
    params: unknown,
    context: ToolExecutionContext
  ): Promise<RunCellResult> {
    // Validate params using type guard
    if (!isRunCellParams(params)) {
      throw new Error(
        `Invalid parameters for runCell. Expected { index?: number }. ` +
          `Received: ${JSON.stringify(params)}`
      );
    }

    // Now TypeScript knows params is RunCellParams!
    const { index } = params;
    const { notebookId } = context;

    if (!notebookId) {
      return formatResponse(
        {
          success: false,
          error: 'Notebook ID is required for this operation.',
        },
        context.format
      ) as RunCellResult;
    }

    // Ensure executor is available
    if (!context.executor) {
      throw new Error(
        'Executor is required for runCell operation. ' +
          'This should be provided by the platform (DefaultExecutor, BridgeExecutor, etc.)'
      );
    }

    try {
      // Call executor to run the cell
      // If index is provided, set active cell first, then run
      // If no index, runs the currently active cell
      await context.executor.execute('runCell', {
        index,
      });

      const message =
        index !== undefined
          ? `Cell at index ${index} executed`
          : 'Active cell executed';

      return formatResponse(
        {
          success: true,
          index,
          message,
        },
        context.format
      ) as RunCellResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to run cell: ${errorMessage}`);
    }
  },
};
