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
import { zodToToolParameters } from '../core/zodUtils';
import { updateCellParamsSchema } from '../schemas/updateCell';

export const updateCellTool: ToolDefinition = {
  name: 'datalayer_updateCell',
  displayName: 'Update Notebook Cell',
  toolReferenceName: 'updateCell',
  description:
    "Updates (overwrites) a cell's source code at the specified index. Does NOT execute the cell.",

  parameters: zodToToolParameters(updateCellParamsSchema),

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
