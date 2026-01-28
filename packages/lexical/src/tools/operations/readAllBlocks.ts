/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Read all blocks operation for Lexical documents
 *
 * @module tools/core/operations/readAllBlocks
 */

import type { ToolOperation, ToolExecutionContext } from '../core/interfaces';
import type { LexicalBlock, BriefBlock } from '../core/types';
import { validateWithZod } from '@datalayer/jupyter-react/tools';
import {
  readAllBlocksParamsSchema,
  type ReadAllBlocksParams,
} from '../schemas/readAllBlocks';

/**
 * Result of reading all blocks
 */
export interface ReadAllBlocksResult {
  /** Whether the operation succeeded */
  success: boolean;

  /** The blocks that were read (each includes block_id) */
  blocks?: LexicalBlock[] | BriefBlock[];

  /** Number of blocks returned */
  blockCount?: number;

  /** Error message if operation failed */
  error?: string;
}

/**
 * Read all blocks operation - retrieves all blocks from a Lexical document
 *
 * Returns all blocks with their block_id values for stable addressing.
 * Use the block_id in subsequent insertBlock operations.
 *
 * Uses lexicalId as the universal identifier (matches Lexical component).
 */
export const readAllBlocksOperation: ToolOperation<
  ReadAllBlocksParams,
  ReadAllBlocksResult
> = {
  name: 'readAllBlocks',

  async execute(
    params: unknown,
    context: ToolExecutionContext,
  ): Promise<ReadAllBlocksResult> {
    // Validate params using Zod
    const validatedParams = validateWithZod(
      readAllBlocksParamsSchema as any,
      params || {},
      'readAllBlocks',
    ) as ReadAllBlocksParams;

    const { format = 'brief' } = validatedParams;
    const { documentId } = context;

    // Validate context
    if (!documentId) {
      throw new Error(
        'Document ID is required for readAllBlocks operation. ' +
          'Ensure the tool execution context includes a valid documentId.',
      );
    }

    // Ensure executor is available
    if (!context.executor) {
      throw new Error(
        'Executor is required for readAllBlocks operation. ' +
          'This should be provided by the platform (DefaultExecutor, BridgeExecutor, etc.)',
      );
    }

    try {
      // Call executor with format parameter
      // NOTE: Don't pass 'id' - DefaultExecutor injects it automatically
      const blocks = (await context.executor.execute(this.name, {
        format,
      })) as LexicalBlock[] | BriefBlock[];

      return {
        success: true,
        blocks,
        blockCount: blocks.length,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to read all blocks: ${errorMessage}`);
    }
  },
};
