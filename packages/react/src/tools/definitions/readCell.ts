/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Read cell tool definition.
 *
 * @module tools/definitions/readCell
 */

import type { ToolDefinition } from '../core/schema';
import { zodToToolParameters } from '../core/zodUtils';
import { readCellParamsSchema } from '../schemas/readCell';

export const readCellTool: ToolDefinition = {
  name: 'datalayer_readCell',
  displayName: 'Read Notebook Cell',
  toolReferenceName: 'readCell',
  description:
    'Reads a specific cell from a Jupyter notebook by index, including source code and outputs',

  parameters: zodToToolParameters(readCellParamsSchema),

  operation: 'readCell',

  config: {
    confirmationMessage: (params: { index: number }) =>
      `Read cell at index ${params.index}?`,
    invocationMessage: (params: { index: number }) =>
      `Reading cell ${params.index}`,
    requiresConfirmation: false,
    canBeReferencedInPrompt: true,
    priority: 'high',
  },

  tags: ['cell', 'notebook', 'read', 'inspect'],
};
