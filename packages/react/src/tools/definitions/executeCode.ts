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
import { zodToToolParameters } from '../core/zodUtils';
import { executeCodeParamsSchema } from '../schemas/executeCode';

export const executeCodeTool: ToolDefinition = {
  name: 'datalayer_executeCode',
  displayName: 'Execute Code in Kernel',
  toolReferenceName: 'executeCode',
  description:
    'Execute code directly in the kernel (not saved to notebook) on the current activated notebook.\n\n' +
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

  operation: 'executeCode',

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
