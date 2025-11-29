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
import { readAllCellsOperation } from './readAllCells';

/**
 * Parameters for readCell operation.
 */
export interface ReadCellParams {
  /** Cell index (0-based) */
  index: number;
  /** Whether to include cell outputs in the response (default: true) */
  includeOutputs?: boolean;
}

/**
 * Validates ReadCellParams at runtime.
 */
function isReadCellParams(params: unknown): params is ReadCellParams {
  if (typeof params !== 'object' || params === null) {
    return false;
  }

  const p = params as Record<string, unknown>;

  // Validate required field
  if (typeof p.index !== 'number') {
    return false;
  }

  // Validate optional field
  if (p.includeOutputs !== undefined && typeof p.includeOutputs !== 'boolean') {
    return false;
  }

  return true;
}

/**
 * Result from readCell operation.
 */
export interface ReadCellResult {
  success: boolean;
  index?: number;
  type?: string;
  source?: string;
  execution_count?: number | null;
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
 *   { documentId: 'file:///notebook.ipynb', executor }
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
      const { documentId } = context;

      if (!documentId) {
        return {
          success: false,
          error: 'Document ID is required for this operation.',
        };
      }

      if (!context.executor) {
        throw new Error('Executor is required for readCell operation.');
      }

      try {
        // First, validate that the index is within bounds
        const cellsResult = await readAllCellsOperation.execute({}, context);

        if (!cellsResult.success || !cellsResult.cells) {
          throw new Error('Failed to read cells for bounds validation');
        }

        const cellCount = cellsResult.cellCount || cellsResult.cells.length;

        // Validate index bounds (match Jupyter MCP Server error format)
        if (index < 0 || index >= cellCount) {
          return {
            success: false,
            error: `Cell index ${index} is out of range. Notebook has ${cellCount} cells.`,
          };
        }

        // Call executor (uses this.name for DRY principle)
        const includeOutputs = params.includeOutputs ?? true;
        const cellData = await context.executor.execute(this.name, {
          index,
          includeOutputs,
        });

        const result = {
          success: true,
          ...(typeof cellData === 'object' && cellData !== null
            ? cellData
            : {}),
        };

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to read cell: ${errorMessage}`);
      }
    },
  };
