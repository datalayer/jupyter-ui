/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Delete cell tool definition.
 *
 * @module tools/definitions/deleteCell
 */

import type { ToolDefinition } from '../core/schema';

export const deleteCellTool: ToolDefinition = {
  name: 'datalayer_deleteCell',
  displayName: 'Delete Notebook Cell',
  toolReferenceName: 'deleteCell',
  description: 'Deletes a cell from a Jupyter notebook at the specified index',

  parameters: {
    type: 'object',
    properties: {
      index: {
        type: 'number',
        description: 'Index of the cell to delete (0-based)',
      },
    },
    required: ['index'],
  },

  operation: 'deleteCell',

  config: {
    confirmationMessage: (params: { index: number }) =>
      `Delete cell at index ${params.index}?`,
    invocationMessage: (params: { index: number }) =>
      `Deleting cell ${params.index}`,
    requiresConfirmation: true,
    canBeReferencedInPrompt: true,
    priority: 'medium',
  },

  tags: ['cell', 'notebook', 'manipulation', 'delete'],
};
