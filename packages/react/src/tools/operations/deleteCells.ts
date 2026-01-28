/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Delete cells operation for notebooks
 *
 * @module tools/operations/deleteCells
 */

import type { ToolOperation, ToolExecutionContext } from '../core/interfaces';
import { validateWithZod } from '../core/zodUtils';
import {
  deleteCellsParamsSchema,
  type DeleteCellsParams,
} from '../schemas/deleteCells';

/**
 * Information about a deleted cell.
 */
export interface DeletedCellInfo {
  /** Original index of the deleted cell */
  index: number;
}

/**
 * Result from deleteCells operation.
 */
export interface DeleteCellsResult {
  success: boolean;
  deletedCells: DeletedCellInfo[];
  message: string;
}

/**
 * Delete cells operation - removes one or more cells from a notebook
 *
 * Complex logic (validation, sorting, reverse-order deletion) is handled in the adapter.
 * This operation validates parameters and delegates to the adapter.
 *
 * @example
 * ```typescript
 * // Delete cells
 * await deleteCellsOperation.execute(
 *   { indices: [1, 3, 5] },
 *   { documentId: "file:///path/to/notebook.ipynb", executor }
 * );
 * ```
 */
export const deleteCellsOperation: ToolOperation<
  DeleteCellsParams,
  DeleteCellsResult
> = {
  name: 'deleteCells',

  async execute(
    params: unknown,
    context: ToolExecutionContext
  ): Promise<DeleteCellsResult> {
    // Validate params using Zod schema
    const { indices } = validateWithZod(
      deleteCellsParamsSchema,
      params,
      this.name
    );
    const { documentId } = context;

    if (!documentId) {
      throw new Error(
        'Document ID is required for deleteCells operation. ' +
          'Ensure the tool execution context includes a valid documentId.'
      );
    }

    // Ensure executor is available
    if (!context.executor) {
      throw new Error(
        'Executor is required for deleteCells operation. ' +
          'This should be provided by the platform (DefaultExecutor, BridgeExecutor, etc.)'
      );
    }

    try {
      // Call deleteCells store method with all indices
      // The adapter handles validation, sorting, and deletion
      // NOTE: Don't pass 'id' - DefaultExecutor injects it automatically
      await context.executor.execute('deleteCells', {
        indices: indices,
      });

      // Format message
      const deletedCells: DeletedCellInfo[] = indices.map(index => ({
        index,
      }));

      const message = deletedCells
        .map(cell => `Deleted cell at index ${cell.index}`)
        .join('\n');

      // Return success result
      return {
        success: true,
        deletedCells,
        message: message || `Deleted ${deletedCells.length} cell(s)`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to delete cell(s): ${errorMessage}`);
    }
  },
};
