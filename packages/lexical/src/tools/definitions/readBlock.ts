/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Tool definition for reading a single block from Lexical documents
 *
 * @module tools/definitions/tools/readBlock
 */

import type { ToolDefinition } from '../core';
import { zodToToolParameters } from '@datalayer/jupyter-react/lib/tools/core/zodUtils';
import { readBlockParamsSchema } from '../schemas/readBlock';

/**
 * Tool definition for reading a single block from a Lexical document
 *
 * Returns the specified block with its complete data.
 */
export const readBlockTool: ToolDefinition = {
  name: 'datalayer_readBlock',
  displayName: 'Read Lexical Block',
  toolReferenceName: 'readBlock',
  description:
    "Read a single block from the currently open Lexical document by its block_id. Use listAvailableBlocks to get available blocks. Returns the block with: block_id, block_type (e.g. 'heading', 'paragraph', 'jupyter-cell'), source (content as string), metadata (properties like level, language). Use block_id values from readAllBlocks. Works on active .lexical file.",

  parameters: zodToToolParameters(readBlockParamsSchema),

  operation: 'readBlock',

  config: {
    confirmationMessage: (params: { id: string }) =>
      `Read block ${params.id} from the lexical document?`,
    invocationMessage: (params: { id: string }) =>
      `Reading block ${params.id} from lexical document`,
    requiresConfirmation: false,
    canBeReferencedInPrompt: true,
    priority: 'medium',
  },

  tags: ['lexical', 'read', 'block', 'single'],
};
