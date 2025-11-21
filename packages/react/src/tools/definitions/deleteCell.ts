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
import { zodToToolParameters } from '../core/zodUtils';
import { deleteCellParamsSchema } from '../schemas/deleteCell';

export const deleteCellTool: ToolDefinition = {
  name: 'datalayer_deleteCell',
  displayName: 'Delete Notebook Cell(s)',
  toolReferenceName: 'deleteCell',
  description:
    'Deletes one or more cells from a Jupyter notebook at the specified indices. Cells are deleted in reverse order to prevent index shifting.',

  // Generate parameters from Zod schema (single source of truth)
  parameters: zodToToolParameters(deleteCellParamsSchema),

  operation: 'deleteCell',

  config: {
    confirmationMessage: (params: { indices: number[] }) =>
      `Delete ${params.indices.length} cell${params.indices.length !== 1 ? 's' : ''} at ${params.indices.length === 1 ? `index ${params.indices[0]}` : `indices ${params.indices.join(', ')}`}?`,
    invocationMessage: (params: { indices: number[] }) =>
      `Deleting ${params.indices.length} cell${params.indices.length !== 1 ? 's' : ''}`,
    requiresConfirmation: true,
    canBeReferencedInPrompt: true,
    priority: 'medium',
  },

  tags: ['cell', 'notebook', 'manipulation', 'delete'],
};
