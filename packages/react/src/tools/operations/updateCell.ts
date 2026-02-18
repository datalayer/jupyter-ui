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
import { validateWithZod } from '../core/zodUtils';
import {
  updateCellParamsSchema,
  type UpdateCellParams,
} from '../schemas/updateCell';
import type { RunCellResult } from './runCell';

/**
 * Result from updateCell operation.
 */
export interface UpdateCellResult {
  success: boolean;
  message: string;
  diff?: string;
  /** Execution result after the cell is updated and run */
  execution?: {
    execution_count?: number | null;
    outputs?: Array<string>;
  };
}

/**
 * Updates cell source content at the specified index.
 *
 * @example
 * ```typescript
 * await updateCellOperation.execute(
 *   { index: 0, source: 'print("Updated")' },
 *   { documentId: 'file:///notebook.ipynb', executor }
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
    // Validate params using Zod schema
    const { index, source } = validateWithZod(
      updateCellParamsSchema,
      params,
      this.name
    );
    const { documentId } = context;

    if (!documentId) {
      throw new Error('Document ID is required for updateCell operation.');
    }

    if (!context.executor) {
      throw new Error('Executor is required for updateCell operation.');
    }

    try {
      // Call executor - adapter returns diff string
      const diff = (await context.executor.execute(this.name, {
        index,
        source,
      })) as string;

      // Format message like MCP server
      const diffMessage = diff
        ? `Cell ${index} overwritten successfully:\n\n\`\`\`diff\n${diff}\n\`\`\``
        : `Cell ${index} overwritten successfully - no changes detected`;

      // Auto-execute the cell after successful update.
      // For code cells this runs the code; for markdown cells this renders them.
      try {
        const runResult = (await context.executor.execute('runCell', {
          index,
        })) as RunCellResult | undefined;

        return {
          success: true,
          message: `${diffMessage}\nCell executed successfully.`,
          diff,
          execution: runResult
            ? {
                execution_count: runResult.execution_count,
                outputs: runResult.outputs,
              }
            : undefined,
        };
      } catch (execError) {
        // Update succeeded but execution failed — still report success
        const execMsg =
          execError instanceof Error ? execError.message : String(execError);
        return {
          success: true,
          message: `${diffMessage}\nExecution failed: ${execMsg}`,
          diff,
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update cell: ${errorMessage}`);
    }
  },
};
