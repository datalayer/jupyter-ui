/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Insert cell tool definition.
 *
 * @module tools/definitions/insertCell
 */

import type { ToolDefinition } from '../core/schema';
import { zodToToolParameters } from '../core/zodUtils';
import { insertCellParamsSchema } from '../schemas/insertCell';

export const insertCellTool: ToolDefinition = {
  name: 'datalayer_insertCell',
  displayName: 'Insert Notebook Cell',
  toolReferenceName: 'insertCell',
  description:
    'IMPORTANT: Call readAllCells first to see the current notebook structure and determine the correct insertion point. Then, insert a code or markdown cell into a Jupyter notebook at a specified position or at the end',

  parameters: zodToToolParameters(insertCellParamsSchema),

  operation: 'insertCell',

  config: {
    confirmationMessage: (params: { type: string; source: string }) =>
      `Insert ${params.type} cell into notebook?\n\n${params.source}`,
    invocationMessage: (params: { type: string }) =>
      `Inserting ${params.type} cell into notebook`,
    requiresConfirmation: true,
    canBeReferencedInPrompt: true,
    priority: 'high',
  },

  tags: ['cell', 'notebook', 'manipulation', 'create'],
};
