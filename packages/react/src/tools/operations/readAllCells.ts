/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Platform-agnostic operation to read all cells.
 *
 * @module tools/operations/readAllCells
 */

import type { ToolOperation, ToolExecutionContext } from '../core/interfaces';
import { formatResponse } from '../core/formatter';

/**
 * Parameters for readAllCells operation (none required).
 */
export type ReadAllCellsParams = Record<string, never>;

/**
 * Result from readAllCells operation.
 */
export interface ReadAllCellsResult {
  success: boolean;
  cells?: Array<{
    index: number;
    type: string;
    source: string;
    outputs?: string[];
  }>;
  cellCount?: number;
  error?: string;
}

/**
 * Reads all cells from a notebook with source and outputs.
 */

export const readAllCellsOperation: ToolOperation<
  ReadAllCellsParams,
  ReadAllCellsResult
> = {
  name: 'readAllCells',

  async execute(
    _params: unknown,
    context: ToolExecutionContext
  ): Promise<ReadAllCellsResult> {
    const { notebookId } = context;

    if (!notebookId) {
      return formatResponse(
        {
          success: false,
          error: 'Notebook ID is required for this operation.',
        },
        context.format
      ) as ReadAllCellsResult;
    }

    if (!context.executor) {
      throw new Error(
        'Executor is required for readAllCells operation. ' +
          'This should be provided by the platform (DefaultExecutor, BridgeExecutor, etc.)'
      );
    }

    try {
      const cells = (await context.executor.execute('getCells', {
        notebookId,
      })) as Array<{
        index: number;
        type: string;
        source: string;
        outputs?: string[];
      }>;

      return formatResponse(
        {
          success: true,
          cells,
          cellCount: cells.length,
        },
        context.format
      ) as ReadAllCellsResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to read all cells: ${errorMessage}`);
    }
  },
};
