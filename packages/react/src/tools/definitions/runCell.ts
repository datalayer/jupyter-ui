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
import { zodToToolParameters } from '../core/zodUtils';
import { runCellParamsSchema } from '../schemas/runCell';

export const runCellTool: ToolDefinition = {
  name: 'datalayer_runCell',
  displayName: 'Run Notebook Cell',
  toolReferenceName: 'runCell',
  description:
    'Runs a code cell in a Jupyter notebook and returns its outputs with execution metadata. ' +
    'Supports timeout and streaming progress updates. ' +
    'Returns execution_count, outputs, and elapsed_time. ' +
    'If no index is provided, runs the currently active cell.',

  parameters: zodToToolParameters(runCellParamsSchema),

  operation: 'runCell',

  config: {
    confirmationMessage: (params: { index?: number }) =>
      params.index !== undefined
        ? `Run cell at index ${params.index}?`
        : 'Run cell?',
    invocationMessage: (params: { index?: number; timeoutSeconds?: number }) =>
      params.index !== undefined
        ? `Running cell ${params.index}${params.timeoutSeconds ? ` (timeout: ${params.timeoutSeconds}s)` : ''}`
        : `Running cell${params.timeoutSeconds ? ` (timeout: ${params.timeoutSeconds}s)` : ''}`,
    requiresConfirmation: false,
    canBeReferencedInPrompt: true,
    priority: 'high',
  },

  tags: ['cell', 'notebook', 'execute', 'run', 'outputs'],
};
