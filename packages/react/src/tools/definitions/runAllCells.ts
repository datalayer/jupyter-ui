/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { ToolDefinition } from '../core/schema';

export const runAllCellsTool: ToolDefinition = {
  name: 'datalayer_runAllCells',
  displayName: 'Run All Notebook Cells',
  toolReferenceName: 'runAllCells',
  description:
    "Runs all cells in a Jupyter notebook sequentially from top to bottom. Each cell's output will be displayed after execution.",

  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },

  operation: 'runAllCells',

  config: {
    confirmationMessage: () => 'Run all cells in the notebook?',
    invocationMessage: () => 'Running all cells',
    requiresConfirmation: false,
    canBeReferencedInPrompt: true,
    priority: 'high',
  },

  tags: ['cell', 'notebook', 'execute', 'run', 'all'],
};
