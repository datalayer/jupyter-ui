/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Platform-agnostic cell read operation.
 *
 * @module tools/operations/readCell
 */

import type { ToolOperation, ToolExecutionContext } from '../core/interfaces';
import { formatResponse } from '../core/formatter';

/**
 * Parameters for readCell operation.
 */
export interface ReadCellParams {
  /** Cell index (0-based) */
  index: number;
}

/**
 * Validates ReadCellParams at runtime.
 */
function isReadCellParams(params: unknown): params is ReadCellParams {
  if (typeof params !== 'object' || params === null) {
    return false;
  }

  const p = params as Record<string, unknown>;
  return typeof p.index === 'number';
}

/**
 * Result from readCell operation.
 */
export interface ReadCellResult {
  success: boolean;
  index?: number;
  type?: string;
  source?: string;
  outputs?: string[];
  error?: string;
}

/**
 * Reads cell content and metadata at the specified index.
 *
 * @example
 * ```typescript
 * const result = await readCellOperation.execute(
 *   { index: 0 },
 *   { notebookId: 'file:///notebook.ipynb', executor }
 * );
 * ```
 */

export const readCellOperation: ToolOperation<ReadCellParams, ReadCellResult> =
  {
    name: 'readCell',

    async execute(
      params: unknown,
      context: ToolExecutionContext
    ): Promise<ReadCellResult> {
      // Validate params using type guard
      if (!isReadCellParams(params)) {
        throw new Error(
          `Invalid parameters for readCell. Expected { index: number }. ` +
            `Received: ${JSON.stringify(params)}`
        );
      }

      // Now TypeScript knows params is ReadCellParams!
      const { index } = params;
      const { notebookId } = context;

      if (!notebookId) {
        return formatResponse(
          {
            success: false,
            error: 'Notebook ID is required for this operation.',
          },
          context.format
        ) as ReadCellResult;
      }

      if (!context.executor) {
        throw new Error('Executor is required for readCell operation.');
      }

      try {
        const cellData = await context.executor.execute('readCell', {
          index,
        });

        return formatResponse(
          {
            success: true,
            ...(typeof cellData === 'object' && cellData !== null
              ? cellData
              : {}),
          },
          context.format
        ) as ReadCellResult;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to read cell: ${errorMessage}`);
      }
    },
  };
