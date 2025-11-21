/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Tool definition for updating a block in Lexical documents
 *
 * @module tools/definitions/tools/updateBlock
 */

import type { ToolDefinition } from '../core/schema';

/**
 * Tool definition for updating an existing block
 *
 * Modifies block type, source content, and/or properties.
 */
export const updateBlockTool: ToolDefinition = {
  name: 'datalayer_updateBlock',
  displayName: 'Update Lexical Block',
  toolReferenceName: 'updateBlock',
  description:
    'Update an existing block in the currently open Lexical document. Can modify block type, source content, and/or properties. Requires block_id from readAllBlocks. At least one of type, source, or properties must be provided. Properties are merged with existing metadata. Works on active .lexical file.',

  parameters: {
    type: 'object' as const,
    properties: {
      id: {
        type: 'string',
        description:
          'The block_id of the block to update (from readAllBlocks result)',
      },
      type: {
        type: 'string',
        description:
          "Optional: New block type ('paragraph', 'heading', 'code', 'quote', 'jupyter-cell', 'list'). If not provided, type remains unchanged.",
      },
      source: {
        type: 'string',
        description:
          'Optional: New block content/source text. For code blocks this is the code, for text blocks this is the text. If not provided, source remains unchanged.',
      },
      properties: {
        type: 'object',
        description:
          'Optional: New or updated metadata object. Examples: {"language": "python"} for code/jupyter-cell, {"tag": "h1"} for headings. Merges with existing properties. If not provided, properties remain unchanged.',
      },
    },
    required: ['id'],
  },

  operation: 'updateBlock',

  config: {
    confirmationMessage: (params: {
      id: string;
      type?: string;
      source?: string;
      properties?: Record<string, unknown>;
    }) => {
      const updates: string[] = [];
      if (params.type) updates.push(`type to ${params.type}`);
      if (params.source) updates.push('source');
      if (params.properties) updates.push('properties');
      return `Update block ${params.id} (${updates.join(', ')})?`;
    },
    invocationMessage: (params: { id: string }) =>
      `Updating block ${params.id}`,
    requiresConfirmation: true,
    canBeReferencedInPrompt: true,
    priority: 'high',
  },

  tags: ['lexical', 'update', 'edit', 'block', 'modify'],
};
