/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Platform-agnostic cell insertion operation.
 *
 * @module tools/operations/insertCell
 */

import type { CellType } from '@jupyterlab/nbformat';
import type { ToolOperation, ToolExecutionContext } from '../core/interfaces';
import { formatResponse } from '../core/formatter';

/**
 * Parameters for insertCell operation.
 */
export interface InsertCellParams {
  /** Cell type ('code', 'markdown', or 'raw') */
  type: CellType;
  /** Cell source content */
  source: string;
  /** Insert position (0-based index, defaults to end) */
  index?: number;
}

/**
 * Validates InsertCellParams at runtime.
 */
function isInsertCellParams(params: unknown): params is InsertCellParams {
  if (typeof params !== 'object' || params === null) {
    return false;
  }

  const p = params as Record<string, unknown>;

  // Validate required fields
  if (typeof p.type !== 'string' || typeof p.source !== 'string') {
    return false;
  }

  // Validate optional fields
  if (p.index !== undefined && typeof p.index !== 'number') {
    return false;
  }

  // Validate type is one of the allowed cell types
  if (!['code', 'markdown', 'raw'].includes(p.type)) {
    return false;
  }

  return true;
}

/**
 * Result from insertCell operation.
 */
export interface InsertCellResult {
  success: boolean;
  index: number;
  message: string;
}

/**
 * Inserts a cell into a notebook at the specified position.
 *
 * @example
 * ```typescript
 * await insertCellOperation.execute(
 *   { type: 'code', source: 'print("Hello")' },
 *   { notebookId: 'file:///path/to/notebook.ipynb', executor }
 * );
 * ```
 */
export const insertCellOperation: ToolOperation<
  InsertCellParams,
  InsertCellResult
> = {
  name: 'insertCell',

  async execute(
    params: unknown,
    context: ToolExecutionContext
  ): Promise<InsertCellResult> {
    // Validate params using type guard
    if (!isInsertCellParams(params)) {
      throw new Error(
        `Invalid parameters for insertCell. Expected { type: CellType, source: string, index?: number }. ` +
          `Received: ${JSON.stringify(params)}`
      );
    }

    // Now TypeScript knows params is InsertCellParams!
    const { type, source, index } = params;
    const { notebookId } = context;

    // Validate context
    if (!notebookId) {
      throw new Error(
        'Notebook ID is required for insertCell operation. ' +
          'Ensure the tool execution context includes a valid notebookId.'
      );
    }

    // Ensure executor is available
    if (!context.executor) {
      throw new Error(
        'Executor is required for insertCell operation. ' +
          'This should be provided by the platform (DefaultExecutor, BridgeExecutor, etc.)'
      );
    }

    try {
      // Call executor (DefaultExecutor calls Notebook2State directly,
      // BridgeExecutor sends message to extension host)
      await context.executor.execute('insertCell', {
        type,
        source,
        index, // undefined means insert at end
      });

      // Return success result
      const typeCapitalized = type.charAt(0).toUpperCase() + type.slice(1);
      const indexMsg = index !== undefined ? ` at index ${index}` : ' at end';

      return formatResponse(
        {
          success: true,
          index: index ?? -1, // -1 indicates "end of notebook"
          message: `✅ ${typeCapitalized} cell inserted${indexMsg}`,
        },
        context.format
      ) as InsertCellResult;
    } catch (error) {
      // Convert error to result with failure status
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to insert cell: ${errorMessage}`);
    }
  },
};
