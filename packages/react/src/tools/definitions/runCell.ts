/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Run cell tool definition.
 *
 * @module tools/definitions/runCell
 */

import type { ToolDefinition } from '../core/schema';

export const runCellTool: ToolDefinition = {
  name: 'datalayer_runCell',
  displayName: 'Run Notebook Cell',
  toolReferenceName: 'runCell',
  description:
    'Runs a code cell in a Jupyter notebook and returns its outputs. If no index is provided, runs the currently active cell.',

  parameters: {
    type: 'object',
    properties: {
      index: {
        type: 'number',
        description:
          'Optional: Index of the cell to run (0-based, must be a code cell). If not provided, runs the active cell.',
      },
    },
    required: [],
  },

  operation: 'runCell',

  config: {
    confirmationMessage: (params: { index?: number }) =>
      params.index !== undefined
        ? `Run cell at index ${params.index}?`
        : 'Run cell?',
    invocationMessage: (params: { index?: number }) =>
      params.index !== undefined
        ? `Running cell ${params.index}`
        : 'Running cell',
    requiresConfirmation: false,
    canBeReferencedInPrompt: true,
    priority: 'high',
  },

  tags: ['cell', 'notebook', 'execute', 'run'],
};
