/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Execute code tool definition.
 *
 * @module tools/definitions/executeCode
 */

import type { ToolDefinition } from '../core/schema';

export const executeCodeTool: ToolDefinition = {
  name: 'datalayer_executeCode',
  displayName: 'Execute Code in Kernel',
  toolReferenceName: 'executeCode',
  description:
    'Executes code directly in the Jupyter kernel without creating or modifying notebook cells. Useful for variable inspection, environment setup, background tasks, and tool introspection. Returns execution outputs including streams, results, and errors.',

  parameters: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'Python code to execute in the kernel',
      },
      storeHistory: {
        type: 'boolean',
        description:
          'Whether to store this execution in kernel history (default: false). Set to true to make this code accessible via In[n].',
      },
      silent: {
        type: 'boolean',
        description:
          'Silent execution - no output displayed (default: false). Useful for background tasks.',
      },
      stopOnError: {
        type: 'boolean',
        description:
          'Stop execution if an error occurs (default: true). Set to false to continue execution even on errors.',
      },
    },
    required: ['code'],
  },

  operation: 'executeCode',

  config: {
    confirmationMessage: (params: { code: string }) =>
      `Execute code: ${params.code.substring(0, 50)}${params.code.length > 50 ? '...' : ''}?`,
    invocationMessage: () => 'Executing code in kernel',
    requiresConfirmation: false,
    canBeReferencedInPrompt: true,
    priority: 'high',
  },

  tags: ['kernel', 'notebook', 'execute', 'code', 'inspection'],
};
