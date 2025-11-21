/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Platform-agnostic batch cell insertion operation.
 *
 * @module tools/operations/insertCells
 */

import type { CellType } from '@jupyterlab/nbformat';
import type { ToolOperation, ToolExecutionContext } from '../core/interfaces';
import { formatResponse } from '../core/formatter';

/**
 * A cell to be inserted in batch operation
 */
export interface CellData {
  /** Cell type ('code', 'markdown', or 'raw') */
  type: CellType;
  /** Cell source content */
  source: string;
}

/**
 * Parameters for insertCells operation.
 */
export interface InsertCellsParams {
  /** Array of cells to insert */
  cells: CellData[];
  /** Insert position (0-based index, defaults to end) */
  index?: number;
}

/**
 * Validates InsertCellsParams at runtime.
 */
function isInsertCellsParams(params: unknown): params is InsertCellsParams {
  if (typeof params !== 'object' || params === null) {
    return false;
  }

  const p = params as Record<string, unknown>;

  // Validate required fields
  if (!Array.isArray(p.cells)) {
    return false;
  }

  // Validate each cell in the array
  for (const cell of p.cells) {
    if (typeof cell !== 'object' || cell === null) {
      return false;
    }
    const c = cell as Record<string, unknown>;
    if (typeof c.type !== 'string' || typeof c.source !== 'string') {
      return false;
    }
    // Validate type is one of the allowed cell types
    if (!['code', 'markdown', 'raw'].includes(c.type)) {
      return false;
    }
  }

  // Validate optional fields
  if (p.index !== undefined && typeof p.index !== 'number') {
    return false;
  }

  return true;
}

/**
 * Result from insertCells operation.
 */
export interface InsertCellsResult {
  success: boolean;
  insertedCount: number;
  startIndex: number;
  message: string;
}

/**
 * Inserts multiple cells into a notebook at the specified position.
 *
 * More efficient than calling insertCell multiple times.
 * Cells are inserted sequentially, each after the previous one.
 *
 * @example
 * ```typescript
 * await insertCellsOperation.execute(
 *   {
 *     cells: [
 *       { type: 'markdown', source: '# Header' },
 *       { type: 'code', source: 'print("Hello")' }
 *     ],
 *     index: 0
 *   },
 *   { notebookId: 'file:///path/to/notebook.ipynb', executor }
 * );
 * ```
 */
export const insertCellsOperation: ToolOperation<
  InsertCellsParams,
  InsertCellsResult
> = {
  name: 'insertCells',

  async execute(
    params: unknown,
    context: ToolExecutionContext
  ): Promise<InsertCellsResult> {
    // Validate params using type guard
    if (!isInsertCellsParams(params)) {
      throw new Error(
        `Invalid parameters for insertCells. Expected { cells: Array<{ type: CellType, source: string }>, index?: number }. ` +
          `Received: ${JSON.stringify(params)}`
      );
    }

    // Now TypeScript knows params is InsertCellsParams!
    const { cells, index } = params;
    const { notebookId } = context;

    // Validate context
    if (!notebookId) {
      throw new Error(
        'Notebook ID is required for insertCells operation. ' +
          'Ensure the tool execution context includes a valid notebookId.'
      );
    }

    // Ensure executor is available
    if (!context.executor) {
      throw new Error(
        'Executor is required for insertCells operation. ' +
          'This should be provided by the platform (DefaultExecutor, BridgeExecutor, etc.)'
      );
    }

    try {
      // Call executor (DefaultExecutor calls Notebook2State directly,
      // BridgeExecutor sends message to extension host)
      await context.executor.execute('insertCells', {
        cells,
        index, // undefined means insert at end
      });

      // Return success result
      const indexMsg = index !== undefined ? ` at index ${index}` : ' at end';

      return formatResponse(
        {
          success: true,
          insertedCount: cells.length,
          startIndex: index ?? -1, // -1 indicates "end of notebook"
          message: `✅ ${cells.length} cell(s) inserted${indexMsg}`,
        },
        context.format
      ) as InsertCellsResult;
    } catch (error) {
      // Convert error to result with failure status
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to insert cells: ${errorMessage}`);
    }
  },
};
