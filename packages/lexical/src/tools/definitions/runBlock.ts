/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Tool definition for running a block in Lexical documents
 *
 * @module tools/definitions/tools/runBlock
 */

import type { ToolDefinition } from '../core/schema';

/**
 * Tool definition for running a single executable block
 *
 * Executes code in jupyter-cell or executable code blocks.
 */
export const runBlockTool: ToolDefinition = {
  name: 'datalayer_runBlock',
  displayName: 'Run Lexical Block',
  toolReferenceName: 'runBlock',
  description:
    'Execute a single block in the currently open Lexical document. Only works on executable blocks (jupyter-cell or code blocks with executable: true). Triggers execution and returns immediately. Use readBlock after execution to check results. Requires block_id from readAllBlocks. Works on active .lexical file.',

  parameters: {
    type: 'object' as const,
    properties: {
      id: {
        type: 'string',
        description:
          'The block_id of the executable block to run (from readAllBlocks result)',
      },
    },
    required: ['id'],
  },

  operation: 'runBlock',

  config: {
    confirmationMessage: (params: { id: string }) => `Run block ${params.id}?`,
    invocationMessage: (params: { id: string }) => `Running block ${params.id}`,
    requiresConfirmation: true,
    canBeReferencedInPrompt: true,
    priority: 'high',
  },

  tags: ['lexical', 'run', 'execute', 'block', 'jupyter'],
};
