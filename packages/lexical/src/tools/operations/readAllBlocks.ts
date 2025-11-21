/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Read all blocks operation for Lexical documents
 *
 * @module tools/core/operations/readAllBlocks
 */

import type {
  ToolOperation,
  LexicalExecutionContext,
} from '../core/interfaces';
import type { LexicalBlock } from '../core/types';
import { formatResponse } from '../core/formatter';

/**
 * Parameters for reading all blocks from a Lexical document
 * Empty object type - reserved for future extensibility
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ReadAllBlocksParams {
  // Empty for now - reserved for future extensibility
}

/**
 * Result of reading all blocks
 */
export interface ReadAllBlocksResult {
  /** Whether the operation succeeded */
  success: boolean;

  /** The blocks that were read (each includes block_id) */
  blocks?: LexicalBlock[];

  /** Number of blocks returned */
  count?: number;

  /** Error message if operation failed */
  error?: string;
}

/**
 * Validates ReadAllBlocksParams at runtime.
 */
function isReadAllBlocksParams(params: unknown): params is ReadAllBlocksParams {
  // ReadAllBlocksParams is currently empty, so just check it's an object
  if (typeof params !== 'object' || params === null) {
    return false;
  }
  return true;
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
    context: LexicalExecutionContext,
  ): Promise<ReadAllBlocksResult> {
    // Validate params using type guard
    if (!isReadAllBlocksParams(params)) {
      throw new Error(
        `Invalid parameters for readAllBlocks. Expected empty object {}. ` +
          `Received: ${JSON.stringify(params)}`,
      );
    }

    // Now TypeScript knows params is ReadAllBlocksParams!
    const { lexicalId } = context;

    // Validate context
    if (!lexicalId) {
      throw new Error(
        'Lexical ID is required for readAllBlocks operation. ' +
          'Ensure the tool execution context includes a valid lexicalId.',
      );
    }

    // Ensure executeCommand is available
    if (!context.executeCommand) {
      throw new Error(
        'executeCommand callback is required for readAllBlocks operation.',
      );
    }

    try {
      // Call internal command with URI (VS Code-specific requirement)
      const blocks = await context.executeCommand<LexicalBlock[]>(
        'lexical.getBlocks',
        {
          lexicalId,
        },
      );

      return formatResponse(
        {
          success: true,
          blocks,
          count: blocks.length,
        },
        context.format,
      ) as ReadAllBlocksResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to read all blocks: ${errorMessage}`);
    }
  },
};
