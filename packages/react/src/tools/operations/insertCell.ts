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
import type { RunCellResult } from './runCell';

/**
 * Result from insertCell operation.
 */
export interface InsertCellResult {
  success: boolean;
  index: number;
  message: string;
  /** Execution result when the inserted cell is a code cell */
  execution?: {
    execution_count?: number | null;
    outputs?: Array<string>;
  };
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
      // Get current cell count for verification
      const cellsBefore = (await context.executor.execute('readAllCells', {
        format: 'brief',
      })) as unknown[];
      const countBefore = cellsBefore?.length ?? 0;

      // Determine the actual insert index
      const actualIndex = index ?? countBefore;

      // Call executor (uses this.name for DRY principle)
      await context.executor.execute(this.name, {
        type,
        source,
        index, // undefined means insert at end
      });

      // Verify insertion by checking cell count increased
      const cellsAfter = (await context.executor.execute('readAllCells', {
        format: 'brief',
      })) as unknown[];
      const countAfter = cellsAfter?.length ?? 0;

      if (countAfter <= countBefore) {
        return {
          success: false,
          index: actualIndex,
          message: `Failed to insert cell at index ${actualIndex} — cell was not added to the notebook (cell count unchanged: ${countBefore}). This can happen if the notebook model is not fully initialised.`,
        };
      }

      // Auto-execute code cells after successful insertion
      if (type === 'code') {
        try {
          const runResult = (await context.executor.execute('runCell', {
            index: actualIndex,
          })) as RunCellResult | undefined;

          return {
            success: true,
            index: actualIndex,
            message: `Cell inserted and executed at index ${actualIndex}`,
            execution: runResult
              ? {
                  execution_count: runResult.execution_count,
                  outputs: runResult.outputs,
                }
              : undefined,
          };
        } catch (execError) {
          // Insertion succeeded but execution failed — still report success
          const execMsg =
            execError instanceof Error ? execError.message : String(execError);
          return {
            success: true,
            index: actualIndex,
            message: `Cell inserted at index ${actualIndex} but execution failed: ${execMsg}`,
          };
        }
      }

      // Non-code cells (markdown, raw) — no execution needed
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
