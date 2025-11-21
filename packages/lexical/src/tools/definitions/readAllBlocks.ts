/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Tool definition for reading all blocks from Lexical documents
 *
 * @module tools/definitions/tools/readAllBlocks
 */

import type { ToolDefinition } from '../core/schema';

/**
 * Tool definition for reading all blocks from a Lexical document
 *
 * Returns all blocks with their block_id values for use in other operations.
 */
export const readAllBlocksTool: ToolDefinition = {
  name: 'datalayer_readAllBlocks',
  displayName: 'Read All Lexical Blocks',
  toolReferenceName: 'readAllBlocks',
  description:
    "Read all blocks from the currently open Lexical document. Returns array of blocks, each with: block_id (stable identifier for insertion), block_type (e.g. 'heading', 'paragraph', 'jupyter-cell'), source (content as string), metadata (properties like level, language). CRITICAL: Use the block_id values from this result for insertBlock's afterId parameter. Works on active .lexical file.",

  parameters: {
    type: 'object' as const,
    properties: {},
    required: [],
  },

  operation: 'readAllBlocks',

  config: {
    confirmationMessage: () => 'Read all blocks from the lexical document?',
    invocationMessage: () => 'Reading all blocks from lexical document',
    requiresConfirmation: false,
    canBeReferencedInPrompt: true,
    priority: 'medium',
  },

  tags: ['lexical', 'read', 'blocks', 'all'],
};
