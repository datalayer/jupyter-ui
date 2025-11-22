/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Tool definition for deleting blocks from Lexical documents
 *
 * @module tools/definitions/tools/deleteBlock
 */

import type { ToolDefinition } from '../core/schema';

/**
 * Tool definition for deleting a block from a Lexical document
 *
 * This tool permanently removes a block by its ID.
 */
export const deleteBlockTool: ToolDefinition = {
  name: 'datalayer_deleteBlock',
  displayName: 'Delete Lexical Block',
  toolReferenceName: 'deleteBlock',
  description:
    'Delete a block from the currently open Lexical document by its block_id. WORKFLOW: 1) Call readBlocks to get block_id values, 2) Pass the block_id of the block to delete. This permanently removes the block and changes appear immediately.',

  parameters: {
    type: 'object' as const,
    properties: {
      id: {
        type: 'string',
        description:
          'ID of the block to delete (from block_id field in readBlocks).',
      },
    },
    required: ['id'],
  },

  operation: 'deleteBlock',

  config: {
    confirmationMessage: (params: { id: string }) =>
      `Delete block ${params.id}? This action cannot be undone.`,
    invocationMessage: (params: { id: string }) =>
      `Deleting block ${params.id} from lexical document`,
    requiresConfirmation: true,
    canBeReferencedInPrompt: true,
    priority: 'high',
  },

  tags: ['lexical', 'delete', 'block', 'edit'],
};
