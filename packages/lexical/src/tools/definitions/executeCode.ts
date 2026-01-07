/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Tool definition for executing code directly in kernel
 *
 * @module tools/definitions/executeCode
 */

import type { ToolDefinition } from '../core';
import { zodToToolParameters } from '@datalayer/jupyter-react/tools';
import { executeCodeParamsSchema } from '../schemas/executeCode';

/**
 * Tool definition for executing code directly in the kernel
 *
 * Executes code without creating or modifying blocks in the document.
 */
export const executeCodeTool: ToolDefinition = {
  name: 'datalayer_executeCode_lexical',
  displayName: 'Execute Code in Kernel (Lexical)',
  toolReferenceName: 'executeCode',
  description:
    'Execute code directly in the kernel without creating blocks. Runs code and returns execution results immediately. Useful for quick computations, variable inspection, or running commands that should not appear in the document. Works on the active kernel for the currently open .lexical file.',

  parameters: zodToToolParameters(executeCodeParamsSchema),

  operation: 'executeCode',

  config: {
    confirmationMessage: (params: { code: string }) =>
      `Execute code: ${params.code.substring(0, 50)}${params.code.length > 50 ? '...' : ''}?`,
    invocationMessage: () => 'Executing code in kernel',
    requiresConfirmation: false,
    canBeReferencedInPrompt: true,
    priority: 'high',
  },

  tags: ['lexical', 'kernel', 'execute', 'code', 'inspection'],
};
