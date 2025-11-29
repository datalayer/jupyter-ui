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
import { readAllCellsOperation } from './readAllCells';
import { validateWithZod } from '../core/zodUtils';
import {
  deleteCellParamsSchema,
  type DeleteCellParams,
} from '../schemas/deleteCell';

/**
 * Information about a deleted cell.
 */
export interface DeletedCellInfo {
  /** Original index of the deleted cell */
  index: number;
  /** Cell type (code, markdown, raw) */
  type: string;
  /** Cell source content */
  source: string;
}

/**
 * Result from deleteCell operation.
 */
export interface DeleteCellResult {
  success: boolean;
  deletedCells: DeletedCellInfo[];
  message: string;
}

/**
 * Deletes one or more cells from a notebook at the specified indices.
 *
 * Cells are deleted in reverse order (highest index first) to prevent
 * index shifting issues during multi-cell deletion. This matches the
 * behavior of the Jupyter MCP Server.
 *
 * @example
 * ```typescript
 * // Delete single cell
 * await deleteCellOperation.execute(
 *   { indices: [2] },
 *   { documentId: "file:///path/to/notebook.ipynb", executor }
 * );
 *
 * // Delete multiple cells
 * await deleteCellOperation.execute(
 *   { indices: [1, 3, 5] },
 *   { documentId: "file:///path/to/notebook.ipynb", executor }
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
    // Validate params using Zod schema
    const { indices } = validateWithZod(
      deleteCellParamsSchema,
      params,
      this.name
    );
    const { documentId } = context;

    if (!documentId) {
      throw new Error(
        'Document ID is required for deleteCell operation. ' +
          'Ensure the tool execution context includes a valid documentId.'
      );
    }

    // Ensure executor is available
    if (!context.executor) {
      throw new Error(
        'Executor is required for deleteCell operation. ' +
          'This should be provided by the platform (DefaultExecutor, BridgeExecutor, etc.)'
      );
    }

    try {
      // First, read all cells to get current state and validate indices
      // Request detailed format to get full source for deletion confirmation
      const cellsResult = await readAllCellsOperation.execute(
        { format: 'detailed' },
        context
      );

      if (!cellsResult.success || !cellsResult.cells) {
        throw new Error('Failed to read cells for bounds validation');
      }

      const cellCount = cellsResult.cellCount || cellsResult.cells.length;
      const cells = cellsResult.cells as import('../core/types').DetailedCell[];

      // Validate ALL indices are in range (match Jupyter MCP Server error format)
      for (const index of indices) {
        if (index < 0 || index >= cellCount) {
          throw new Error(
            `Cell index ${index} is out of range. Notebook has ${cellCount} cells.`
          );
        }
      }

      // Sort indices in REVERSE order (highest to lowest) to prevent index shifting
      // This matches the Jupyter MCP Server behavior
      const sortedIndices = [...indices].sort((a, b) => b - a);

      // Store information about cells before deletion
      const deletedCells: DeletedCellInfo[] = [];

      // Delete each cell in reverse order
      for (const index of sortedIndices) {
        // Store cell info before deletion (from original read)
        const cell = cells[index];

        // Execute deletion via executor
        await context.executor.execute(this.name, {
          index,
        });

        // Track deletion with original index
        deletedCells.push({
          index,
          type: cell.type,
          source: cell.source,
        });
      }

      // Format message similar to Jupyter MCP Server
      const message = deletedCells
        .map(cell => {
          return (
            `Deleted cell at index ${cell.index}:\n` +
            `Type: ${cell.type}\n` +
            `----------------------------------------`
          );
        })
        .join('\n\n');

      // Return success result
      return {
        success: true,
        deletedCells: deletedCells.reverse(), // Reverse to show in original order
        message,
      };
    } catch (error) {
      // Convert error to descriptive error
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to delete cell(s): ${errorMessage}`);
    }
  },
};
