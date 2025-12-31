/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Tool definition for inserting blocks into Lexical documents
 *
 * @module tools/definitions/tools/insertBlock
 */

import type { ToolDefinition } from '../core';
import { zodToToolParameters } from '@datalayer/jupyter-react';
import { insertBlockParamsSchema } from '../schemas/insertBlock';

/**
 * Tool definition for inserting a block into a Lexical document
 *
 * Supports inserting various block types:
 * - paragraph: Regular text paragraph
 * - heading: Semantic HTML heading (NOT markdown - use plain text, specify tag property for h1-h6)
 * - code: Code block (specify language in properties)
 * - quote: Blockquote
 * - list/listitem: List blocks
 * - jupyter-cell: Executable Jupyter code cells
 */
export const insertBlockTool: ToolDefinition = {
  name: 'datalayer_insertBlock',
  displayName: 'Insert Lexical Block',
  toolReferenceName: 'insertBlock',
  description:
    "Insert different type of content with blocks. Use listAvailableBlocks to get availables blocks. When inserting MULTIPLE blocks sequentially (e.g., creating a document outline with heading + paragraph + code), ALWAYS use afterId: 'BOTTOM' for each insertion to append blocks in order. For single insertions, call readAllBlocks first to see document structure. Position blocks using afterId: 'TOP' (beginning), 'BOTTOM' (end - REQUIRED for sequential inserts), or a specific block_id value from readAllBlocks. IMPORTANT: heading blocks are semantic HTML (NOT markdown) - use plain text in source field without # symbols, specify tag property (h1-h6) instead. Use listAvailableBlocks to see all supported types. Works on active .lexical file.",

  parameters: zodToToolParameters(insertBlockParamsSchema),

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
