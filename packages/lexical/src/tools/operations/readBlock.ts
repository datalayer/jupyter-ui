/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Read single block operation for Lexical documents
 *
 * @module tools/core/operations/readBlock
 */

import type { ToolOperation, ToolExecutionContext } from '../core/interfaces';
import type { LexicalBlock } from '../core/types';
import { readAllBlocksOperation } from './readAllBlocks';
import { validateWithZod } from '@datalayer/jupyter-react';
import {
  readBlockParamsSchema,
  type ReadBlockParams,
} from '../schemas/readBlock';

/**
 * Result of reading a single block
 */
export interface ReadBlockResult {
  /** Whether the operation succeeded */
  success: boolean;

  /** The block that was read (includes block_id) */
  block?: LexicalBlock;

  /** Error message if operation failed */
  error?: string;
}

/**
 * Read block operation - retrieves a single block from a Lexical document
 *
 * Returns the block with the specified block_id for inspection.
 *
 * Uses documentId as the universal identifier (matches Lexical component).
 */
export const readBlockOperation: ToolOperation<
  ReadBlockParams,
  ReadBlockResult
> = {
  name: 'readBlock',

  async execute(
    params: unknown,
    context: ToolExecutionContext,
  ): Promise<ReadBlockResult> {
    // Validate params using Zod
    const validatedParams = validateWithZod(
      readBlockParamsSchema as any,
      params,
      'readBlock',
    ) as ReadBlockParams;

    const { id } = validatedParams;
    const { documentId } = context;

    // Validate context
    if (!documentId) {
      throw new Error(
        'Document ID is required for readBlock operation. ' +
          'Ensure the tool execution context includes a valid documentId.',
      );
    }

    // Ensure executor is available
    if (!context.executor) {
      throw new Error(
        'Executor is required for readBlock operation. ' +
          'This should be provided by the platform (DefaultExecutor, BridgeExecutor, etc.)',
      );
    }

    try {
      // First, validate that the block ID exists (bounds validation)
      const blocksResult = await readAllBlocksOperation.execute({}, context);

      if (!blocksResult.success || !blocksResult.blocks) {
        throw new Error('Failed to read blocks for bounds validation');
      }

      const blockCount = blocksResult.blocks.length;
      const blockExists = blocksResult.blocks.some(
        block => block.block_id === id,
      );

      // Validate block ID exists (match similar pattern to readCell)
      if (!blockExists) {
        return {
          success: false,
          error: `Block ID '${id}' not found. Document has ${blockCount} block${blockCount !== 1 ? 's' : ''}.`,
        };
      }

      // Call executor (uses this.name for DRY principle)
      const block = (await context.executor.execute(this.name, {
        blockId: id,
      })) as LexicalBlock;

      return {
        success: true,
        block,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to read block: ${errorMessage}`);
    }
  },
};
