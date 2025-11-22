/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Tool definition for listing available Lexical block types
 *
 * @module tools/definitions/tools/listAvailableBlocks
 */

import type { ToolDefinition } from '../core/schema';

/**
 * Tool definition for listing available Lexical block types
 *
 * This tool exposes the schema of all registered Lexical node types,
 * enabling AI assistants to understand what blocks can be inserted and their properties.
 *
 * This is essential for:
 * - Understanding the full capabilities of the Lexical editor
 * - Inserting appropriate block types based on user intent
 * - Using correct properties for each block type
 * - Discovering special Datalayer blocks (Jupyter cells)
 */
export const listAvailableBlocksTool: ToolDefinition = {
  name: 'datalayer_listAvailableBlocks',
  displayName: 'List Available Lexical Blocks',
  toolReferenceName: 'listAvailableBlocks',
  description:
    "Discover available block types for the currently open Lexical document. Returns schema for all registered blocks including: 'jupyter-cell' (executable code cell with language property), standard blocks (paragraph, heading, code, quote, list, table). Use this to see exact block type names and required properties before calling insertBlock.",

  parameters: {
    type: 'object' as const,
    properties: {
      category: {
        type: 'string',
        description:
          'Optional category filter. Categories: "text" (paragraph, quote), "heading" (h1-h6), "code" (code blocks), "list" (bullet/numbered), "table", "media" (plots), "special" (jupyter-cell). Omit to get all block types.',
        enum: ['text', 'heading', 'code', 'media', 'list', 'table', 'special'],
      },
    },
    required: [],
  },

  operation: 'listAvailableBlocks',

  config: {
    confirmationMessage: (params: { category?: string }) =>
      params.category
        ? `List available ${params.category} block types?`
        : 'List all available block types?',
    invocationMessage: (params: { category?: string }) =>
      params.category
        ? `Listing ${params.category} block types`
        : 'Listing all available block types',
    requiresConfirmation: false,
    canBeReferencedInPrompt: true,
    priority: 'low',
  },

  tags: ['lexical', 'schema', 'discovery', 'blocks'],
};
