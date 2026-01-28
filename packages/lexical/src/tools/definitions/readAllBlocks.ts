/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Tool definition for reading all blocks from Lexical documents
 *
 * @module tools/definitions/tools/readAllBlocks
 */

import type { ToolDefinition } from '../core';
import { zodToToolParameters } from '@datalayer/jupyter-react/tools';
import { readAllBlocksParamsSchema } from '../schemas/readAllBlocks';

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
    "Read all blocks from the currently open Lexical document. Use listAvailableBlocks to get available block types. Supports two response formats: 'brief' (default, ~1,100 tokens) returns block_id, block_type, and 40-char content preview for structure queries; 'detailed' (~20,000 tokens) returns full content with source, metadata, and properties. Use brief when you need to see document structure, count blocks, or quickly scan content. Use detailed when you need to read full content. Brief format preview shows: lists as comma-separated items, code/jupyter-cell as first line, horizontalrule as empty string. Returns array of blocks with: block_id (stable identifier for insertion), block_type (e.g. 'heading', 'paragraph', 'jupyter-cell'), preview (brief only), and optionally source/metadata (detailed only). CRITICAL: Use the block_id values from this result for insertBlock's afterId parameter. Works on active .lexical file.",

  parameters: zodToToolParameters(readAllBlocksParamsSchema),

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
