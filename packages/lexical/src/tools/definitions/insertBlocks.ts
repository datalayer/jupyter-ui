/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Tool definition for inserting multiple blocks into Lexical documents
 *
 * @module tools/definitions/tools/insertBlocks
 */

import type { ToolDefinition } from '../core/schema';

/**
 * Tool definition for inserting multiple blocks into a Lexical document
 *
 * More efficient than multiple insertBlock calls - inserts all blocks in a single operation.
 * Blocks are inserted sequentially, each after the previous one.
 */
export const insertBlocksTool: ToolDefinition = {
  name: 'datalayer_insertBlocks',
  displayName: 'Insert Multiple Lexical Blocks',
  toolReferenceName: 'insertBlocks',
  description:
    'Inserts multiple blocks into a Lexical document in a single operation. More efficient than calling insertBlock multiple times.',

  parameters: {
    type: 'object' as const,
    properties: {
      afterId: {
        type: 'string',
        description:
          "Insert after block with id given by afterId. Use 'TOP' to insert at beginning, 'BOTTOM' to insert at end, or a block_id from readBlocks. Subsequent blocks are inserted sequentially.",
      },
      blocks: {
        type: 'array',
        description:
          'Array of blocks to insert. Each block must have type and source.',
        items: {
          type: 'object',
          description:
            'Block to insert with its type, content, and optional metadata.',
          properties: {
            type: {
              type: 'string',
              description:
                "Type of block: 'jupyter-cell', 'heading', 'paragraph', 'code', 'quote', or 'list'.",
            },
            source: {
              type: 'string',
              description: 'Content of the block (code, text, or markdown)',
            },
            properties: {
              type: 'object',
              description:
                'Optional: Metadata object. Examples: {"language": "python"} for code/jupyter-cell, {"level": 1} for h1 heading.',
            },
          },
          required: ['type', 'source'],
        },
      },
    },
    required: ['afterId', 'blocks'],
  },

  operation: 'insertBlocks',

  config: {
    confirmationMessage: (params: {
      blocks: Array<{ type: string; source: string }>;
      afterId: string;
    }) =>
      `Insert ${params.blocks.length} block(s) ${params.afterId === 'TOP' ? 'at beginning' : params.afterId === 'BOTTOM' ? 'at end' : `after block ${params.afterId}`}?`,
    invocationMessage: (params: { blocks: Array<unknown> }) =>
      `Inserting ${params.blocks.length} blocks into lexical document`,
    requiresConfirmation: true,
    canBeReferencedInPrompt: true,
    priority: 'high',
  },

  tags: ['lexical', 'insert', 'block', 'batch', 'edit'],
};
