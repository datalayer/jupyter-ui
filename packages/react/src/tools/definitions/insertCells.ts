/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Insert cells tool definition.
 *
 * @module tools/definitions/insertCells
 */

import type { ToolDefinition } from '../core/schema';

export const insertCellsTool: ToolDefinition = {
  name: 'datalayer_insertCells',
  displayName: 'Insert Multiple Notebook Cells',
  toolReferenceName: 'insertCells',
  description:
    'Inserts multiple code or markdown cells into a Jupyter notebook in a single operation. More efficient than calling insertCell multiple times.',

  parameters: {
    type: 'object',
    properties: {
      cells: {
        type: 'array',
        description:
          'Array of cells to insert. Each cell must have type and source.',
        items: {
          type: 'object',
          description: 'Cell to insert with its type and content',
          properties: {
            type: {
              type: 'string',
              enum: ['code', 'markdown'],
              description:
                "Type of cell: 'code' for executable Python code or 'markdown' for formatted text",
            },
            source: {
              type: 'string',
              description: 'Content of the cell (Python code or Markdown text)',
            },
          },
          required: ['type', 'source'],
        },
      },
      index: {
        type: 'number',
        description:
          'Optional: Position where the first cell should be inserted (0-based index). Subsequent cells are inserted after. If not provided, inserts at the end.',
      },
    },
    required: ['cells'],
  },

  operation: 'insertCells',

  config: {
    confirmationMessage: (params: {
      cells: Array<{ type: string; source: string }>;
      index?: number;
    }) => {
      const indexMsg =
        params.index !== undefined ? ` at index ${params.index}` : ' at end';
      return `Insert ${params.cells.length} cell(s)${indexMsg}?`;
    },
    invocationMessage: (params: { cells: Array<unknown> }) =>
      `Inserting ${params.cells.length} cells into notebook`,
    requiresConfirmation: true,
    canBeReferencedInPrompt: true,
    priority: 'high',
  },

  tags: ['cell', 'notebook', 'manipulation', 'create', 'batch'],
};
