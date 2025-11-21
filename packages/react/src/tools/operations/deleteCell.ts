/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Platform-agnostic cell deletion operation.
 *
 * @module tools/operations/deleteCell
 */

import type { ToolOperation, ToolExecutionContext } from '../core/interfaces';
import { formatResponse } from '../core/formatter';

/**
 * Parameters for deleteCell operation.
 */
export interface DeleteCellParams {
  /** Cell index (0-based) */
  index: number;
}

/**
 * Validates DeleteCellParams at runtime.
 */
function isDeleteCellParams(params: unknown): params is DeleteCellParams {
  if (typeof params !== 'object' || params === null) {
    return false;
  }

  const p = params as Record<string, unknown>;
  return typeof p.index === 'number';
}

/**
 * Result from deleteCell operation.
 */
export interface DeleteCellResult {
  success: boolean;
  index: number;
  message: string;
}

/**
 * Deletes a cell from a notebook at the specified index.
 *
 * @example
 * ```typescript
 * await deleteCellOperation.execute(
 *   { index: 2 },
 *   { notebookId: "file:///path/to/notebook.ipynb", executor }
 * );
 * ```
 */
export const deleteCellOperation: ToolOperation<
  DeleteCellParams,
  DeleteCellResult
> = {
  name: 'deleteCell',

  async execute(
    params: unknown,
    context: ToolExecutionContext
  ): Promise<DeleteCellResult> {
    // Validate params using type guard
    if (!isDeleteCellParams(params)) {
      throw new Error(
        `Invalid parameters for deleteCell. Expected { index: number }. ` +
          `Received: ${JSON.stringify(params)}`
      );
    }

    // Now TypeScript knows params is DeleteCellParams!
    const { index } = params;
    const { notebookId } = context;

    if (!notebookId) {
      return formatResponse(
        {
          success: false,
          error: 'Notebook ID is required for this operation.',
        },
        context.format
      ) as unknown as DeleteCellResult;
    }

    // Ensure executor is available
    if (!context.executor) {
      throw new Error(
        'Executor is required for deleteCell operation. ' +
          'This should be provided by the platform (DefaultExecutor, BridgeExecutor, etc.)'
      );
    }

    try {
      // Call executor
      await context.executor.execute('deleteCell', {
        index,
      });

      // Return success result
      return formatResponse(
        {
          success: true,
          index: index,
          message: `✅ Cell at index ${index} deleted successfully`,
        },
        context.format
      ) as unknown as DeleteCellResult;
    } catch (error) {
      // Convert error to descriptive error
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to delete cell: ${errorMessage}`);
    }
  },
};
