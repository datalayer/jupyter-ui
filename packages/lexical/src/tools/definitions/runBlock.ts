/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Tool definition for running a block in Lexical documents
 *
 * @module tools/definitions/tools/runBlock
 */

import type { ToolDefinition } from '../core';
import { zodToToolParameters } from '@datalayer/jupyter-react';
import { runBlockParamsSchema } from '../schemas/runBlock';

/**
 * Tool definition for running a single executable block
 *
 * Executes code in jupyter-cell or executable code blocks with bounds validation and timeout support.
 */
export const runBlockTool: ToolDefinition = {
  name: 'datalayer_runBlock',
  displayName: 'Run Lexical Block',
  toolReferenceName: 'runBlock',
  description:
    'Execute a single block in the currently open Lexical document by block_id. WORKFLOW: 1) Call readAllBlocks to get block_id values, 2) Pass block_id to execute. Validates block exists before execution. Only works on executable blocks (jupyter-cell or code blocks with executable: true). Optional timeout (timeoutSeconds) and streaming (stream, progressInterval) parameters available. Triggers execution and returns immediately. Use readBlock after execution to check results. Works on active .lexical file.',

  parameters: zodToToolParameters(runBlockParamsSchema),

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
