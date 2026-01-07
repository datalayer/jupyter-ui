/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Tool definition for running all executable blocks in Lexical documents
 *
 * @module tools/definitions/tools/runAllBlocks
 */

import type { ToolDefinition } from '../core';
import { zodToToolParameters } from '@datalayer/jupyter-react/tools';
import { runAllBlocksParamsSchema } from '../schemas/runAllBlocks';

/**
 * Tool definition for running all executable blocks in sequence
 *
 * Executes all jupyter-cell and executable code blocks in the document.
 */
export const runAllBlocksTool: ToolDefinition = {
  name: 'datalayer_runAllBlocks',
  displayName: 'Run All Lexical Blocks',
  toolReferenceName: 'runAllBlocks',
  description:
    'Execute all executable blocks in the currently open Lexical document in sequence. Only runs executable blocks (jupyter-cell or code blocks with executable: true). Non-executable blocks are skipped. Triggers execution and returns immediately with count of blocks executed. Use readAllBlocks after execution to check results. Works on active .lexical file.',

  parameters: zodToToolParameters(runAllBlocksParamsSchema),

  operation: 'runAllBlocks',

  config: {
    confirmationMessage: () =>
      'Run all executable blocks in the lexical document?',
    invocationMessage: () =>
      'Running all executable blocks in lexical document',
    requiresConfirmation: true,
    canBeReferencedInPrompt: true,
    priority: 'high',
  },

  tags: ['lexical', 'run', 'execute', 'blocks', 'all', 'jupyter'],
};
