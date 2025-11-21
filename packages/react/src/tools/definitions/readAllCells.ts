/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Read all cells tool definition.
 *
 * @module tools/definitions/readAllCells
 */

import type { ToolDefinition } from '../core/schema';

export const readAllCellsTool: ToolDefinition = {
  name: 'datalayer_readAllCells',
  displayName: 'Read All Notebook Cells',
  toolReferenceName: 'readAllCells',
  description:
    'Reads all cells from a Jupyter notebook, including source code and outputs for each cell',

  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },

  operation: 'readAllCells',

  config: {
    confirmationMessage: () => 'Read all cells from notebook?',
    invocationMessage: () => 'Reading all cells',
    requiresConfirmation: false,
    canBeReferencedInPrompt: true,
    priority: 'high',
  },

  tags: ['cell', 'notebook', 'read', 'inspect', 'all'],
};
