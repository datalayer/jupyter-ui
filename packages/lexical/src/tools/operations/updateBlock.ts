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

import type {
  ToolOperation,
  LexicalExecutionContext,
} from '../core/interfaces';
import { formatResponse } from '../core/formatter';

/**
 * Parameters for updating a block in a Lexical document
 */
export interface UpdateBlockParams {
  /**
   * ID of the block to update (from block_id field in readAllBlocks)
   */
  id: string;

  /**
   * Optional: New block type (e.g., "paragraph", "heading", "code", "quote", "jupyter-cell")
   * If not provided, block type remains unchanged
   */
  type?: string;

  /**
   * Optional: New block content/source text
   * For code blocks and jupyter-cells, this is the code
   * For paragraphs/headings, this is the text
   * If not provided, source remains unchanged
   */
  source?: string;

  /**
   * Optional: New or updated metadata object
   * e.g., { level: 1 } for headings, { language: "python" } for code
   * If not provided, properties remain unchanged
   * If provided, merges with existing properties
   */
  properties?: Record<string, unknown>;
}

/**
 * Result of updating a block
 */
export interface UpdateBlockResult {
  /** Whether the operation succeeded */
  success: boolean;

  /** The ID of the updated block */
  id?: string;

  /** Error message if operation failed */
  error?: string;
}

/**
 * Validates UpdateBlockParams at runtime.
 */
function isUpdateBlockParams(params: unknown): params is UpdateBlockParams {
  if (typeof params !== 'object' || params === null) {
    return false;
  }

  const p = params as Record<string, unknown>;

  // Validate required field
  if (typeof p.id !== 'string') {
    return false;
  }

  // Validate optional fields if provided
  if (p.type !== undefined && typeof p.type !== 'string') {
    return false;
  }

  if (p.source !== undefined && typeof p.source !== 'string') {
    return false;
  }

  if (
    p.properties !== undefined &&
    (typeof p.properties !== 'object' || p.properties === null)
  ) {
    return false;
  }

  return true;
}

/**
 * Update block operation - modifies an existing block in a Lexical document
 *
 * Allows updating block type, source content, and/or properties.
 * At least one of type, source, or properties must be provided.
 *
 * Uses lexicalId as the universal identifier (matches Lexical component).
 */
export const updateBlockOperation: ToolOperation<
  UpdateBlockParams,
  UpdateBlockResult
> = {
  name: 'updateBlock',

  async execute(
    params: unknown,
    context: LexicalExecutionContext,
  ): Promise<UpdateBlockResult> {
    // Validate params using type guard
    if (!isUpdateBlockParams(params)) {
      throw new Error(
        `Invalid parameters for updateBlock. Expected { id: string, type?: string, source?: string, properties?: object }. ` +
          `Received: ${JSON.stringify(params)}`,
      );
    }

    // Now TypeScript knows params is UpdateBlockParams!
    const { id, type, source, properties } = params;
    const { lexicalId } = context;

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
    if (!lexicalId) {
      throw new Error(
        'Lexical ID is required for updateBlock operation. ' +
          'Ensure the tool execution context includes a valid lexicalId.',
      );
    }

    // Ensure executeCommand is available
    if (!context.executeCommand) {
      throw new Error(
        'executeCommand callback is required for updateBlock operation.',
      );
    }

    try {
      // Build update data - only include fields that are provided
      const updates: Record<string, unknown> = {};
      if (type !== undefined) {
        updates.block_type = type;
      }
      if (source !== undefined) {
        updates.source = source;
      }
      if (properties !== undefined) {
        updates.metadata = properties;
      }

      // Call internal command with URI (VS Code-specific requirement)
      await context.executeCommand('lexical.updateBlock', {
        lexicalId,
        blockId: id,
        updates,
      });

      return formatResponse(
        {
          success: true,
          id: id,
        },
        context.format,
      ) as UpdateBlockResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update block: ${errorMessage}`);
    }
  },
};
