/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Platform-agnostic operation to execute all cells.
 *
 * @module tools/operations/runAllCells
 */

import type { ToolOperation, ToolExecutionContext } from '../core/interfaces';
import { formatResponse } from '../core/formatter';

/**
 * Parameters for runAllCells operation (none required).
 */
export type RunAllCellsParams = Record<string, never>;

/**
 * Result from runAllCells operation.
 */
export interface RunAllCellsResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Executes all cells in a notebook sequentially from top to bottom.
 */

export const runAllCellsOperation: ToolOperation<
  RunAllCellsParams,
  RunAllCellsResult
> = {
  name: 'runAllCells',

  async execute(
    _params: unknown,
    context: ToolExecutionContext
  ): Promise<RunAllCellsResult> {
    const { notebookId } = context;

    if (!notebookId) {
      return formatResponse(
        {
          success: false,
          error: 'Notebook ID is required for this operation.',
        },
        context.format
      ) as RunAllCellsResult;
    }

    if (!context.executor) {
      throw new Error(
        'Executor is required for runAllCells operation. ' +
          'This should be provided by the platform (DefaultExecutor, BridgeExecutor, etc.)'
      );
    }

    try {
      await context.executor.execute('runAllCells', {});

      return formatResponse(
        {
          success: true,
          message: 'All cells executed successfully',
        },
        context.format
      ) as RunAllCellsResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to run all cells: ${errorMessage}`);
    }
  },
};
