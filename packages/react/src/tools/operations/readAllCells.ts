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
import type { BriefCell, DetailedCell } from '../core/types';
import { validateWithZod } from '../core/zodUtils';
import {
  readAllCellsParamsSchema,
  type ReadAllCellsParams,
} from '../schemas/readAllCells';

/**
 * Result from readAllCells operation.
 */
export interface ReadAllCellsResult {
  success: boolean;
  cells?: BriefCell[] | DetailedCell[];
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
    params: unknown,
    context: ToolExecutionContext
  ): Promise<ReadAllCellsResult> {
    // Validate params using Zod
    const validatedParams = validateWithZod(
      readAllCellsParamsSchema,
      params || {},
      'readAllCells'
    );

    const { format = 'brief' } = validatedParams;
    const { documentId } = context;

    if (!documentId) {
      return {
        success: false,
        error: 'Document ID is required for this operation.',
      };
    }

    if (!context.executor) {
      throw new Error(
        'Executor is required for readAllCells operation. ' +
          'This should be provided by the platform (DefaultExecutor, BridgeExecutor, etc.)'
      );
    }

    try {
      // Call executor with format parameter
      const cells = (await context.executor.execute(this.name, {
        format,
      })) as BriefCell[] | DetailedCell[];

      return {
        success: true,
        cells,
        cellCount: cells.length,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to read all cells: ${errorMessage}`);
    }
  },
};
