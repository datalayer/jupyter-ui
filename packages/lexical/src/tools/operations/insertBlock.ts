/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Insert block operation for Lexical documents
 *
 * @module tools/core/operations/insertBlock
 */

import type { ToolOperation, ToolExecutionContext } from '../core/interfaces';
import { validateWithZod } from '@datalayer/jupyter-react/tools';
import {
  insertBlockParamsSchema,
  type InsertBlockParams,
} from '../schemas/insertBlock';

/**
 * Result of inserting a block
 */
export interface InsertBlockResult {
  /** Whether the operation succeeded */
  success: boolean;

  /** ID of the newly inserted block */
  blockId?: string;

  /** Success message describing the insertion */
  message?: string;

  /** Error message if operation failed */
  error?: string;
}

/**
 * Insert block operation - adds a new block to a Lexical document
 *
 * Supports inserting various block types:
 * - paragraph: Regular text paragraph
 * - heading: Heading block (specify tag: h1-h6 in metadata)
 * - code: Code block (specify language in metadata)
 * - quote: Blockquote
 * - list/listitem: List blocks
 */
export const insertBlockOperation: ToolOperation<
  InsertBlockParams,
  InsertBlockResult
> = {
  name: 'insertBlock',

  async execute(
    params: unknown,
    context: ToolExecutionContext,
  ): Promise<InsertBlockResult> {
    // Validate params using Zod
    const validatedParams = validateWithZod(
      insertBlockParamsSchema as any,
      params,
      'insertBlock',
    ) as InsertBlockParams;

    const { afterId, type, source, metadata } = validatedParams;
    const { documentId } = context;

    // Validate context
    if (!documentId) {
      throw new Error(
        'Document ID is required for insertBlock operation. ' +
          'Ensure the tool execution context includes a valid documentId.',
      );
    }

    // Default metadata for jupyter-cell blocks when metadata is missing
    // This handles cases where agents forget to include metadata
    const finalMetadata =
      type === 'jupyter-cell' &&
      (!metadata || Object.keys(metadata).length === 0)
        ? { language: 'python' }
        : metadata;

    // Ensure executor is available
    if (!context.executor) {
      throw new Error(
        'Executor is required for insertBlock operation. ' +
          'This should be provided by the platform (DefaultExecutor, BridgeExecutor, etc.)',
      );
    }

    try {
      // Call executor with individual parameters (matches notebook pattern)
      // The state method will handle creating the LexicalBlock object
      const result: any = await context.executor.execute(this.name, {
        type,
        source,
        metadata: finalMetadata,
        afterId,
      });

      const message =
        afterId === 'TOP'
          ? `Block of type '${type}' inserted at the beginning of the document`
          : afterId === 'BOTTOM'
            ? `Block of type '${type}' inserted at the end of the document`
            : `Block of type '${type}' inserted after block '${afterId}'`;

      return {
        success: true,
        blockId: result?.blockId,
        message,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to insert block: ${errorMessage}`);
    }
  },
};
