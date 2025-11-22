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

import type {
  ToolOperation,
  LexicalExecutionContext,
} from '../core/interfaces';
import { formatResponse } from '../core/formatter';

/**
 * Parameters for deleting a block from a Lexical document
 */
export interface DeleteBlockParams {
  /**
   * ID of the block to delete (from block_id field in readBlocks)
   */
  id: string;
}

/**
 * Result of deleting a block
 */
export interface DeleteBlockResult {
  /** Whether the operation succeeded */
  success: boolean;

  /** The ID of the deleted block */
  id?: string;

  /** Error message if operation failed */
  error?: string;
}

/**
 * Validates DeleteBlockParams at runtime.
 */
function isDeleteBlockParams(params: unknown): params is DeleteBlockParams {
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
 * Delete block operation - removes a block from a Lexical document
 *
 * Uses lexicalId as the universal identifier (matches Lexical component).
 *
 * Architecture:
 * - Core layer: Works with lexicalId (platform-agnostic)
 * - VS Code adapter: Converts lexicalId → documentUri via registry
 * - Internal command: Uses documentUri to send message to webview
 * - Webview: Lexical component uses same lexicalId
 */
export const deleteBlockOperation: ToolOperation<
  DeleteBlockParams,
  DeleteBlockResult
> = {
  name: 'deleteBlock',

  async execute(
    params: unknown,
    context: LexicalExecutionContext,
  ): Promise<DeleteBlockResult> {
    // Validate params using type guard
    if (!isDeleteBlockParams(params)) {
      throw new Error(
        `Invalid parameters for deleteBlock. Expected { id: string }. ` +
          `Received: ${JSON.stringify(params)}`,
      );
    }

    // Now TypeScript knows params is DeleteBlockParams!
    const { id } = params;
    const { lexicalId } = context;

    // Validate context
    if (!lexicalId) {
      throw new Error(
        'Lexical ID is required for deleteBlock operation. ' +
          'Ensure the tool execution context includes a valid lexicalId.',
      );
    }

    // Ensure executeCommand is available
    if (!context.executeCommand) {
      throw new Error(
        'executeCommand callback is required for deleteBlock operation.',
      );
    }

    try {
      // Call internal command with URI (VS Code-specific requirement)
      await context.executeCommand('lexical.deleteBlock', {
        lexicalId,
        blockId: id,
      });

      return formatResponse(
        {
          success: true,
          id: id,
        },
        context.format,
      ) as DeleteBlockResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to delete block: ${errorMessage}`);
    }
  },
};
