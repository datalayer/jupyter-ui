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

import type { ToolOperation, ToolExecutionContext } from '../core/interfaces';
import { validateWithZod } from '../core/zodUtils';
import {
  insertCellParamsSchema,
  type InsertCellParams,
} from '../schemas/insertCell';

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
 *   { documentId: 'file:///path/to/notebook.ipynb', executor }
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
    // Validate params using Zod schema
    const { type, source, index } = validateWithZod(
      insertCellParamsSchema,
      params,
      this.name
    );
    const { documentId } = context;

    // Validate context
    if (!documentId) {
      throw new Error(
        'Document ID is required for insertCell operation. ' +
          'Ensure the tool execution context includes a valid documentId.'
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
      // Determine the actual insert index
      let actualIndex = index;
      if (actualIndex === undefined) {
        // Get current cell count to determine actual insertion position
        const cells = (await context.executor.execute('readAllCells', {
          format: 'brief',
        })) as unknown[];
        actualIndex = cells?.length ?? 0;
      }

      // Call executor (uses this.name for DRY principle)
      await context.executor.execute(this.name, {
        type,
        source,
        index, // undefined means insert at end
      });

      // Return success result with correct index
      return {
        success: true,
        index: actualIndex,
        message: `Cell inserted at index ${actualIndex}`,
      };
    } catch (error) {
      // Convert error to result with failure status
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to insert cell: ${errorMessage}`);
    }
  },
};
