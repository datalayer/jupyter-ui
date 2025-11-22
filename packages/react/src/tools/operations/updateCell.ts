/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Platform-agnostic cell update operation.
 *
 * @module tools/operations/updateCell
 */

import type { ToolOperation, ToolExecutionContext } from '../core/interfaces';
import { formatResponse } from '../core/formatter';

/**
 * Parameters for updateCell operation.
 */
export interface UpdateCellParams {
  /** Cell index (0-based) */
  index: number;
  /** New cell source content */
  source: string;
}

/**
 * Validates UpdateCellParams at runtime.
 */
function isUpdateCellParams(params: unknown): params is UpdateCellParams {
  if (typeof params !== 'object' || params === null) {
    return false;
  }

  const p = params as Record<string, unknown>;
  return typeof p.index === 'number' && typeof p.source === 'string';
}

/**
 * Result from updateCell operation.
 */
export interface UpdateCellResult {
  success: boolean;
  index?: number;
  message?: string;
  error?: string;
}

/**
 * Updates cell source content at the specified index.
 *
 * @example
 * ```typescript
 * await updateCellOperation.execute(
 *   { index: 0, source: 'print("Updated")' },
 *   { notebookId: 'file:///notebook.ipynb', executor }
 * );
 * ```
 */

export const updateCellOperation: ToolOperation<
  UpdateCellParams,
  UpdateCellResult
> = {
  name: 'updateCell',

  async execute(
    params: unknown,
    context: ToolExecutionContext
  ): Promise<UpdateCellResult> {
    // Validate params using type guard
    if (!isUpdateCellParams(params)) {
      throw new Error(
        `Invalid parameters for updateCell. Expected { index: number, source: string }. ` +
          `Received: ${JSON.stringify(params)}`
      );
    }

    // Now TypeScript knows params is UpdateCellParams!
    const { index, source } = params;
    const { notebookId } = context;

    if (!notebookId) {
      return formatResponse(
        {
          success: false,
          error: 'Notebook ID is required for this operation.',
        },
        context.format
      ) as UpdateCellResult;
    }

    if (!context.executor) {
      throw new Error('Executor is required for updateCell operation.');
    }

    try {
      await context.executor.execute('updateCell', {
        index,
        source,
      });

      return formatResponse(
        {
          success: true,
          index,
          message: `✅ Cell at index ${index} updated successfully`,
        },
        context.format
      ) as UpdateCellResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update cell: ${errorMessage}`);
    }
  },
};
