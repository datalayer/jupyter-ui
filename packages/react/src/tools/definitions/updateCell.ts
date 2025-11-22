/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Update cell tool definition.
 *
 * @module tools/definitions/updateCell
 */

import type { ToolDefinition } from '../core/schema';

export const updateCellTool: ToolDefinition = {
  name: 'datalayer_updateCell',
  displayName: 'Update Notebook Cell',
  toolReferenceName: 'updateCell',
  description:
    "Updates (overwrites) a cell's source code at the specified index. Does NOT execute the cell.",

  parameters: {
    type: 'object',
    properties: {
      index: {
        type: 'number',
        description: 'Index of the cell to update (0-based)',
      },
      source: {
        type: 'string',
        description: 'New source code for the cell',
      },
    },
    required: ['index', 'source'],
  },

  operation: 'updateCell',

  config: {
    confirmationMessage: (params: { index: number; source: string }) =>
      `Update cell at index ${params.index}?\n\n${params.source}`,
    invocationMessage: (params: { index: number }) =>
      `Updating cell ${params.index}`,
    requiresConfirmation: false,
    canBeReferencedInPrompt: true,
    priority: 'medium',
  },

  tags: ['cell', 'notebook', 'manipulation', 'update'],
};
