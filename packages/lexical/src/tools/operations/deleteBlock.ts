/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Delete block operation for Lexical documents
 *
 * @module tools/core/operations/deleteBlock
 */

import type { ToolOperation, ToolExecutionContext } from '../core/interfaces';
import type { LexicalBlock } from '../core/types';
import { readAllBlocksOperation } from './readAllBlocks';
import { validateWithZod } from '@datalayer/jupyter-react';
import {
  deleteBlockParamsSchema,
  type DeleteBlockParams,
} from '../schemas/deleteBlock';

/**
 * Information about a deleted block.
 */
export interface DeletedBlockInfo {
  /** Block ID of the deleted block */
  id: string;
  /** Block type (e.g. paragraph, heading, code, jupyter-cell) */
  type: string;
  /** Block source content */
  source: string | string[];
}

/**
 * Result of deleting a block
 */
export interface DeleteBlockResult {
  /** Whether the operation succeeded */
  success: boolean;

  /** Array of deleted blocks with their information */
  deletedBlocks: DeletedBlockInfo[];

  /** Formatted message describing the deletion */
  message: string;
}

/**
 * Delete block operation - removes one or more blocks from a Lexical document
 *
 * IDs are stable identifiers so deletion order does not matter (unlike index-based deletion).
 *
 * Uses documentId as the universal identifier (matches Lexical component).
 *
 * Architecture:
 * - Core layer: Works with documentId (platform-agnostic)
 * - VS Code adapter: Converts documentId → documentUri via registry
 * - Internal command: Uses documentUri to send message to webview
 * - Webview: Lexical component uses same documentId
 *
 * @example
 * ```typescript
 * // Delete blocks
 * await deleteBlockOperation.execute(
 *   { ids: ["block-123", "block-456", "block-789"] },
 *   { documentId: "doc-1", executeCommand }
 * );
 * ```
 */
export const deleteBlockOperation: ToolOperation<
  DeleteBlockParams,
  DeleteBlockResult
> = {
  name: 'deleteBlock',

  async execute(
    params: unknown,
    context: ToolExecutionContext,
  ): Promise<DeleteBlockResult> {
    // Validate params using Zod
    const validatedParams = validateWithZod(
      deleteBlockParamsSchema as any,
      params,
      'deleteBlock',
    ) as DeleteBlockParams;

    const { ids } = validatedParams;
    const { documentId } = context;

    // Validate context
    if (!documentId) {
      throw new Error(
        'Document ID is required for deleteBlock operation. ' +
          'Ensure the tool execution context includes a valid documentId.',
      );
    }

    // Ensure executor is available
    if (!context.executor) {
      throw new Error(
        'Executor is required for deleteBlock operation. ' +
          'This should be provided by the platform (DefaultExecutor, BridgeExecutor, etc.)',
      );
    }

    try {
      // First, read all blocks to get current state and validate IDs
      // Use detailed format to get source for deletion messages
      const blocksResult = await readAllBlocksOperation.execute(
        { format: 'detailed' },
        context,
      );

      if (!blocksResult.success || !blocksResult.blocks) {
        throw new Error('Failed to read blocks for bounds validation');
      }

      const blocks = blocksResult.blocks as LexicalBlock[];
      const blockIds = new Set(blocks.map(block => block.block_id));

      // Validate ALL IDs exist
      const missingIds: string[] = [];
      for (const id of ids) {
        if (!blockIds.has(id)) {
          missingIds.push(id);
        }
      }

      if (missingIds.length > 0) {
        throw new Error(
          `Block ID(s) not found: ${missingIds.join(', ')}. ` +
            `Document has ${blocks.length} blocks.`,
        );
      }

      // Store information about blocks before deletion
      const deletedBlocks: DeletedBlockInfo[] = [];

      // Delete each block (order doesn't matter - IDs are stable)
      for (const id of ids) {
        // Find and store block info before deletion
        const block = blocks.find(b => b.block_id === id);

        if (!block) {
          // This shouldn't happen after validation, but be safe
          throw new Error(`Block with ID '${id}' not found during deletion`);
        }

        // Execute deletion via executor
        await context.executor!.execute(this.name, {
          blockId: id,
        });

        // Track deletion
        deletedBlocks.push({
          id: block.block_id,
          type: block.block_type,
          source: block.source,
        });
      }

      // Format message similar to deleteCell pattern
      const message = deletedBlocks
        .map(block => {
          return (
            `Deleted block with ID '${block.id}':\n` +
            `Type: ${block.type}\n` +
            `----------------------------------------`
          );
        })
        .join('\n\n');

      // Return success result
      return {
        success: true,
        deletedBlocks,
        message,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to delete block(s): ${errorMessage}`);
    }
  },
};
