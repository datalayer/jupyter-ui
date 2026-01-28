/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Delete blocks operation for Lexical documents
 *
 * @module tools/core/operations/deleteBlocks
 */

import type { ToolOperation, ToolExecutionContext } from '../core/interfaces';
import { validateWithZod } from '@datalayer/jupyter-react/tools';
import {
  deleteBlocksParamsSchema,
  type DeleteBlocksParams,
} from '../schemas/deleteBlocks';

/**
 * Information about a deleted block.
 */
export interface DeletedBlockInfo {
  /** Block ID of the deleted block */
  id: string;
}

/**
 * Result of deleting blocks
 */
export interface DeleteBlocksResult {
  /** Whether the operation succeeded */
  success: boolean;

  /** Array of deleted blocks with their IDs */
  deletedBlocks: DeletedBlockInfo[];

  /** Formatted message describing the deletion */
  message: string;
}

/**
 * Delete blocks operation - removes one or more blocks from a Lexical document
 *
 * Complex logic (validation, sorting, cascading deletion handling) is handled in the adapter.
 * This operation validates parameters and delegates to the adapter.
 *
 * @example
 * ```typescript
 * // Delete blocks
 * await deleteBlocksOperation.execute(
 *   { ids: ["block-123", "block-456", "block-789"] },
 *   { documentId: "doc-1", executor }
 * );
 * ```
 */
export const deleteBlocksOperation: ToolOperation<
  DeleteBlocksParams,
  DeleteBlocksResult
> = {
  name: 'deleteBlocks',

  async execute(
    params: unknown,
    context: ToolExecutionContext,
  ): Promise<DeleteBlocksResult> {
    // Validate params using Zod
    const validatedParams = validateWithZod(
      deleteBlocksParamsSchema as any,
      params,
      'deleteBlocks',
    ) as DeleteBlocksParams;

    const { ids } = validatedParams;
    const { documentId } = context;

    // Validate context
    if (!documentId) {
      throw new Error(
        'Document ID is required for deleteBlocks operation. ' +
          'Ensure the tool execution context includes a valid documentId.',
      );
    }

    // Ensure executor is available
    if (!context.executor) {
      throw new Error(
        'Executor is required for deleteBlocks operation. ' +
          'This should be provided by the platform (DefaultExecutor, BridgeExecutor, etc.)',
      );
    }

    try {
      // Call deleteBlocks store method with all IDs
      // The adapter handles validation, sorting, and cascading deletions
      // NOTE: Don't pass 'id' - DefaultExecutor injects it automatically
      const result = (await context.executor.execute('deleteBlocks', {
        blockIds: ids,
      })) as any;

      // Adapter returns { success, deletedBlocks }
      if (!result || !result.deletedBlocks) {
        throw new Error('Adapter did not return expected result structure');
      }

      // Format message
      const message = result.deletedBlocks
        .map((block: DeletedBlockInfo) => {
          return `Deleted block with ID '${block.id}'`;
        })
        .join('\n');

      // Return success result
      return {
        success: true,
        deletedBlocks: result.deletedBlocks,
        message: message || `Deleted ${result.deletedBlocks.length} block(s)`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to delete block(s): ${errorMessage}`);
    }
  },
};
