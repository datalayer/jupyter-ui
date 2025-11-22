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

import type {
  ToolOperation,
  LexicalExecutionContext,
} from '../core/interfaces';
import type { LexicalBlock } from '../core/types';
import { formatResponse } from '../core/formatter';

/**
 * Parameters for reading a single block from a Lexical document
 */
export interface ReadBlockParams {
  /**
   * ID of the block to read (from block_id field in readAllBlocks)
   */
  id: string;
}

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
 * Validates ReadBlockParams at runtime.
 */
function isReadBlockParams(params: unknown): params is ReadBlockParams {
  if (typeof params !== 'object' || params === null) {
    return false;
  }

  const p = params as Record<string, unknown>;

  // Validate required field
  if (typeof p.id !== 'string') {
    return false;
  }

  return true;
}

/**
 * Read block operation - retrieves a single block from a Lexical document
 *
 * Returns the block with the specified block_id for inspection.
 *
 * Uses lexicalId as the universal identifier (matches Lexical component).
 */
export const readBlockOperation: ToolOperation<
  ReadBlockParams,
  ReadBlockResult
> = {
  name: 'readBlock',

  async execute(
    params: unknown,
    context: LexicalExecutionContext,
  ): Promise<ReadBlockResult> {
    // Validate params using type guard
    if (!isReadBlockParams(params)) {
      throw new Error(
        `Invalid parameters for readBlock. Expected { id: string }. ` +
          `Received: ${JSON.stringify(params)}`,
      );
    }

    // Now TypeScript knows params is ReadBlockParams!
    const { id } = params;
    const { lexicalId } = context;

    // Validate context
    if (!lexicalId) {
      throw new Error(
        'Lexical ID is required for readBlock operation. ' +
          'Ensure the tool execution context includes a valid lexicalId.',
      );
    }

    // Ensure executeCommand is available
    if (!context.executeCommand) {
      throw new Error(
        'executeCommand callback is required for readBlock operation.',
      );
    }

    try {
      // Call internal command with URI (VS Code-specific requirement)
      const block = await context.executeCommand<LexicalBlock>(
        'lexical.getBlock',
        {
          lexicalId,
          blockId: id,
        },
      );

      return formatResponse(
        {
          success: true,
          block,
        },
        context.format,
      ) as ReadBlockResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to read block: ${errorMessage}`);
    }
  },
};
