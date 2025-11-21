/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Insert cell tool definition.
 *
 * @module tools/definitions/insertCell
 */

import type { ToolDefinition } from '../core/schema';

export const insertCellTool: ToolDefinition = {
  name: 'datalayer_insertCell',
  displayName: 'Insert Notebook Cell',
  toolReferenceName: 'insertCell',
  description:
    'Inserts a code or markdown cell into a Jupyter notebook at a specified position or at the end',

  parameters: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['code', 'markdown'],
        description:
          "Type of cell to insert: 'code' for executable Python code or 'markdown' for formatted text",
      },
      source: {
        type: 'string',
        description: 'Content of the cell (Python code or Markdown text)',
      },
      index: {
        type: 'number',
        description:
          'Optional: Position where the cell should be inserted (0-based index). If not provided, inserts at the end.',
      },
    },
    required: ['type', 'source'],
  },

  operation: 'insertCell',

  config: {
    confirmationMessage: (params: { type: string; source: string }) =>
      `Insert ${params.type} cell into notebook?\n\n${params.source}`,
    invocationMessage: (params: { type: string }) =>
      `Inserting ${params.type} cell into notebook`,
    requiresConfirmation: true,
    canBeReferencedInPrompt: true,
    priority: 'high',
  },

  tags: ['cell', 'notebook', 'manipulation', 'create'],
};
