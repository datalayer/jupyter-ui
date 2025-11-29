/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Read all cells tool definition.
 *
 * @module tools/definitions/readAllCells
 */

import type { ToolDefinition } from '../core/schema';
import { zodToToolParameters } from '../core/zodUtils';
import { readAllCellsParamsSchema } from '../schemas/readAllCells';

export const readAllCellsTool: ToolDefinition = {
  name: 'datalayer_readAllCells',
  displayName: 'Read All Notebook Cells',
  toolReferenceName: 'readAllCells',
  description:
    "Read all cells from the Jupyter notebook. Supports two response formats: 'brief' (default) returns index, type, and 40-char content preview for structure queries and counting cells; 'detailed' returns full content with source, execution_count, and outputs. Use brief when you need to see notebook structure, count cells, or quickly scan content. Use detailed when you need to read full cell content or outputs. Brief format preview shows first 40 characters of cell source. Returns array of cells with: index (cell position), type (code, markdown, raw), preview (brief only), and optionally source/execution_count/outputs (detailed only). Works on active notebook.",

  parameters: zodToToolParameters(readAllCellsParamsSchema),

  operation: 'readAllCells',

  config: {
    confirmationMessage: () => 'Read all cells from notebook?',
    invocationMessage: () => 'Reading all cells',
    requiresConfirmation: false,
    canBeReferencedInPrompt: true,
    priority: 'high',
  },

  tags: ['cell', 'notebook', 'read', 'inspect', 'all'],
};
