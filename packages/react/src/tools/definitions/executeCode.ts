/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Execute code tool definition.
 *
 * @module tools/definitions/executeCode
 */

import type { ToolDefinition } from '../core/schema';
import { zodToToolParameters } from '../core/zodUtils';
import { executeCodeParamsSchema } from '../schemas/executeCode';

export const executeCodeTool: ToolDefinition = {
  name: 'datalayer_executeCodeInNotebook',
  displayName: 'Execute Code in Notebook Kernel',
  toolReferenceName: 'executeCodeInNotebook',
  description:
    'Execute code directly in the notebook kernel (not saved to the notebook) on the current activated notebook. ' +
    'Named for the notebook so it is never confused with the document kernel tool.\n\n' +
    'Recommended to use in following cases:\n' +
    '1. Execute Jupyter magic commands (e.g., %timeit, %pip install xxx)\n' +
    '2. Performance profiling and debugging\n' +
    '3. View intermediate variable values (e.g., print(xxx), df.head())\n' +
    "4. Temporary calculations and quick tests (e.g., np.mean(df['xxx']))\n" +
    '5. Execute Shell commands in Jupyter server (e.g., !git xxx)\n\n' +
    'Under no circumstances should you use this tool to:\n' +
    '1. Import new modules or perform variable assignments that affect subsequent Notebook execution\n' +
    "2. Execute dangerous code that may harm the Jupyter server or the user's data without permission",

  parameters: zodToToolParameters(executeCodeParamsSchema),

  operation: 'executeCodeInNotebook',

  config: {
    confirmationMessage: (params: { code: string }) =>
      `Execute code: ${params.code.substring(0, 50)}${params.code.length > 50 ? '...' : ''}?`,
    invocationMessage: () => 'Executing code in kernel',
    requiresConfirmation: false,
    canBeReferencedInPrompt: true,
    priority: 'high',
  },

  tags: ['kernel', 'notebook', 'execute', 'code', 'inspection', 'magic'],
};
