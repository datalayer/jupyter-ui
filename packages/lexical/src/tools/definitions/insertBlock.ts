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
import { zodToToolParameters } from '@datalayer/jupyter-react/tools';
import { insertBlockParamsSchema } from '../schemas/insertBlock';

/**
 * Tool definition for inserting a block into a Lexical document
 *
 * Supports inserting various block types:
 * - paragraph: Regular text paragraph
 * - heading: Semantic HTML heading (NOT markdown - use plain text, specify tag in metadata for h1-h6)
 * - code: Code block (specify language in metadata)
 * - quote: Blockquote
 * - list/listitem: List blocks
 * - jupyter-cell: Executable Jupyter code cells
 */
export const insertBlockTool: ToolDefinition = {
  name: 'datalayer_insertBlock',
  displayName: 'Insert Lexical Block',
  toolReferenceName: 'insertBlock',
  description:
    "Insert blocks into Lexical documents (.dlex files). IMPORTANT: Lexical documents support EXECUTABLE JUPYTER CELLS - use type='jupyter-cell' to insert Python/R/Julia code cells that can be executed via kernel (just like .ipynb notebooks). Other block types: paragraph, heading, code (non-executable syntax highlighting), quote, list, table, collapsible, equation, image, youtube, horizontalrule. CRITICAL: DO NOT use markdown syntax in source field. Heading blocks use PLAIN TEXT (no # symbols) - specify tag metadata (h1-h6) instead. Inline formatting like **bold** or *italic* is automatically converted. ALWAYS call listAvailableBlocks FIRST to see block types and required metadata format. When inserting MULTIPLE blocks sequentially (e.g., creating a document outline with heading + paragraph + code), ALWAYS use afterId: 'BOTTOM' for each insertion to append blocks in order. For single insertions, call readAllBlocks first to see document structure. Position blocks using afterId: 'TOP' (beginning), 'BOTTOM' (end - REQUIRED for sequential inserts), or a specific block_id value from readAllBlocks. To insert blocks INSIDE a collapsible: 1) First insert collapsible (type='collapsible'), which returns a blockId, 2) Then insert nested blocks with metadata.collapsible set to that RETURNED BLOCK ID (NOT 'TOP' or 'BOTTOM'). Example: result = insertBlock({type: 'collapsible', source: 'Section', afterId: 'BOTTOM'}); insertBlock({type: 'paragraph', source: 'text', metadata: {collapsible: result.blockId}, afterId: 'BOTTOM'}). DO NOT use position markers (TOP/BOTTOM) as collapsible IDs - they are only for afterId positioning. Works on active .lexical/.dlex file.",

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
