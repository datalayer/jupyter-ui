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

/**
 * Result from updateCell operation.
 */
export interface UpdateCellResult {
  success: boolean;
  message: string;
  diff?: string;
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
      const message = diff
        ? `Cell ${index} overwritten successfully:\n\n\`\`\`diff\n${diff}\n\`\`\``
        : `Cell ${index} overwritten successfully - no changes detected`;

      return {
        success: true,
        message,
        diff,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update cell: ${errorMessage}`);
    }
  },
};
