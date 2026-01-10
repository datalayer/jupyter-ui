/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Update block operation for Lexical documents
 *
 * @module tools/core/operations/updateBlock
 */

import type { ToolOperation, ToolExecutionContext } from '../core/interfaces';
import { validateWithZod } from '@datalayer/jupyter-react/tools';
import {
  updateBlockParamsSchema,
  type UpdateBlockParams,
} from '../schemas/updateBlock';

/**
 * Result of updating a block
 */
export interface UpdateBlockResult {
  /** Whether the operation succeeded */
  success: boolean;

  /** The ID of the updated block */
  id?: string;

  /** Success message describing the update */
  message?: string;

  /** Error message if operation failed */
  error?: string;
}

/**
 * Update block operation - modifies an existing block in a Lexical document
 *
 * Allows updating block type, source content, and/or properties.
 * At least one of type, source, or properties must be provided.
 *
 * Uses documentId as the universal identifier (matches Lexical component).
 */
export const updateBlockOperation: ToolOperation<
  UpdateBlockParams,
  UpdateBlockResult
> = {
  name: 'updateBlock',

  async execute(
    params: unknown,
    context: ToolExecutionContext,
  ): Promise<UpdateBlockResult> {
    // Validate params using Zod
    const validatedParams = validateWithZod(
      updateBlockParamsSchema as any,
      params,
      'updateBlock',
    ) as UpdateBlockParams;

    const { id, type, source, properties } = validatedParams;
    const { documentId } = context;

    // Validate that at least one update field is provided
    if (
      type === undefined &&
      source === undefined &&
      properties === undefined
    ) {
      throw new Error(
        'At least one of type, source, or properties must be provided for updateBlock operation.',
      );
    }

    // Validate context
    if (!documentId) {
      throw new Error(
        'Document ID is required for updateBlock operation. ' +
          'Ensure the tool execution context includes a valid documentId.',
      );
    }

    // Ensure executor is available
    if (!context.executor) {
      throw new Error(
        'Executor is required for updateBlock operation. ' +
          'This should be provided by the platform (DefaultExecutor, BridgeExecutor, etc.)',
      );
    }

    try {
      // Call executor with individual parameters (matches notebook pattern)
      // The state method will handle merging updates
      await context.executor.execute(this.name, {
        blockId: id,
        type,
        source,
        properties,
      });

      const updatedFields = [
        type !== undefined && 'type',
        source !== undefined && 'source',
        properties !== undefined && 'properties',
      ]
        .filter(Boolean)
        .join(', ');
      const message = `Block '${id}' updated successfully (${updatedFields})`;

      return {
        success: true,
        id: id,
        message,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update block: ${errorMessage}`);
    }
  },
};
