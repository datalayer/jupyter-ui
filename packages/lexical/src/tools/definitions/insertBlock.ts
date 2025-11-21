/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Tool definition for inserting blocks into Lexical documents
 *
 * @module tools/definitions/tools/insertBlock
 */

import type { ToolDefinition } from '../core/schema';

/**
 * Tool definition for inserting a block into a Lexical document
 *
 * Supports inserting various block types:
 * - paragraph: Regular text paragraph
 * - heading: Heading block (specify tag: h1-h6 in properties)
 * - code: Code block (specify language in properties)
 * - quote: Blockquote
 * - list/listitem: List blocks
 */
export const insertBlockTool: ToolDefinition = {
  name: 'datalayer_insertBlock',
  displayName: 'Insert Lexical Block',
  toolReferenceName: 'insertBlock',
  description:
    'Inserts a block into a Lexical document at a specified position',

  parameters: {
    type: 'object' as const,
    properties: {
      afterId: {
        type: 'string',
        description:
          "Insert after block with id given by afterId. Use 'TOP' to insert at beginning, 'BOTTOM' to insert at end, or a block_id from readBlocks to insert after a specific block.",
      },
      type: {
        type: 'string',
        description:
          "Type of block to insert: 'jupyter-cell', 'heading', 'paragraph', 'code', 'quote', or 'list'.",
      },
      source: {
        type: 'string',
        description: 'Content of the block (code, text, etc.)',
      },
      properties: {
        type: 'object',
        description:
          'Optional: Metadata object for the block. Examples: {"language": "python"} for code/jupyter-cell, {"level": 1} for h1 heading.',
      },
    },
    required: ['afterId', 'type', 'source'],
  },

  operation: 'insertBlock',

  config: {
    confirmationMessage: (params: {
      type: string;
      source: string;
      afterId: string;
    }) =>
      `Insert ${params.type} block ${params.afterId === 'TOP' ? 'at beginning' : params.afterId === 'BOTTOM' ? 'at end' : `after block ${params.afterId}`}?\n\n${params.source}`,
    invocationMessage: (params: { type: string }) =>
      `Inserting ${params.type} block into lexical document`,
    requiresConfirmation: true,
    canBeReferencedInPrompt: true,
    priority: 'high',
  },

  tags: ['lexical', 'insert', 'block', 'edit'],
};
