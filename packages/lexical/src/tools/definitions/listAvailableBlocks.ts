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

import type { ToolDefinition } from '../core';
import { zodToToolParameters } from '@datalayer/jupyter-react/tools';
import { listAvailableBlocksParamsSchema } from '../schemas/listAvailableBlocks';

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
    "Discover available block types for the currently open Lexical document. Available blocks: paragraph, heading, quote, code, list, horizontalrule, jupyter-cell (executable), equation, image, youtube (video embed), table (data table), collapsible (expandable section). Returns detailed schema including required/optional metadata for each block type. Set type parameter to specific block type (e.g., 'youtube', 'table') or 'all' (default) for all blocks. Use this BEFORE calling insertBlock to see exact type names and required metadata format.",

  parameters: zodToToolParameters(listAvailableBlocksParamsSchema),

  operation: 'listAvailableBlocks',

  config: {
    confirmationMessage: (params: { type?: string }) =>
      params.type && params.type !== 'all'
        ? `List details for '${params.type}' block type?`
        : 'List all available block types?',
    invocationMessage: (params: { type?: string }) =>
      params.type && params.type !== 'all'
        ? `Listing '${params.type}' block type details`
        : 'Listing all available block types',
    requiresConfirmation: false,
    canBeReferencedInPrompt: true,
    priority: 'low',
  },

  tags: ['lexical', 'schema', 'discovery', 'blocks'],
};
