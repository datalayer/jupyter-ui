/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Tool definition for deleting blocks from Lexical documents
 *
 * @module tools/definitions/tools/deleteBlocks
 */

import type { ToolDefinition } from '../core';
import { zodToToolParameters } from '@datalayer/jupyter-react/tools';
import { deleteBlocksParamsSchema } from '../schemas/deleteBlocks';

/**
 * Tool definition for deleting one or more blocks from a Lexical document
 *
 * This tool permanently removes blocks by their IDs. Supports both single and multi-delete operations.
 */
export const deleteBlocksTool: ToolDefinition = {
  name: 'datalayer_deleteBlocks',
  displayName: 'Delete Lexical Block(s)',
  toolReferenceName: 'deleteBlocks',
  description:
    'Delete one or more blocks from the currently open Lexical document by block_id. Pass array of block IDs to delete. WORKFLOW: 1) Call readAllBlocks to get block_id values, 2) Pass block_id array to delete. Validates all IDs exist before deletion. This permanently removes blocks and changes appear immediately. Works on active .lexical file.',

  parameters: zodToToolParameters(deleteBlocksParamsSchema),

  operation: 'deleteBlocks',

  config: {
    confirmationMessage: (params: { ids: string[] }) => {
      const count = params.ids.length;
      return count === 1
        ? `Delete block ${params.ids[0]}? This action cannot be undone.`
        : `Delete ${count} blocks (${params.ids.join(', ')})? This action cannot be undone.`;
    },
    invocationMessage: (params: { ids: string[] }) => {
      const count = params.ids.length;
      return count === 1
        ? `Deleting block ${params.ids[0]} from lexical document`
        : `Deleting ${count} blocks from lexical document`;
    },
    requiresConfirmation: true,
    canBeReferencedInPrompt: true,
    priority: 'high',
  },

  tags: ['lexical', 'delete', 'block', 'edit'],
};
