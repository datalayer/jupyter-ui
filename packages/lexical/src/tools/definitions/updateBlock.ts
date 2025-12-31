/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Tool definition for updating a block in Lexical documents
 *
 * @module tools/definitions/tools/updateBlock
 */

import type { ToolDefinition } from '../core';
import { zodToToolParameters } from '@datalayer/jupyter-react';
import { updateBlockParamsSchema } from '../schemas/updateBlock';

/**
 * Tool definition for updating an existing block
 *
 * Modifies block type, source content, and/or properties.
 */
export const updateBlockTool: ToolDefinition = {
  name: 'datalayer_updateBlock',
  displayName: 'Update Lexical Block',
  toolReferenceName: 'updateBlock',
  description:
    'Update an existing block in the currently open Lexical document. Use listAvailableBlocks to get available blocks. Can modify block type, source content, and/or properties. Requires id from readAllBlocks. At least one of type, source, or properties must be provided. Properties are merged with existing metadata. Works on active .lexical file.',

  parameters: zodToToolParameters(updateBlockParamsSchema),

  operation: 'updateBlock',

  config: {
    confirmationMessage: (params: {
      id: string;
      type?: string;
      source?: string;
      properties?: Record<string, unknown>;
    }) => {
      const updates: string[] = [];
      if (params.type) updates.push(`type to ${params.type}`);
      if (params.source) updates.push('source');
      if (params.properties) updates.push('properties');
      return `Update block ${params.id} (${updates.join(', ')})?`;
    },
    invocationMessage: (params: { id: string }) =>
      `Updating block ${params.id}`,
    requiresConfirmation: true,
    canBeReferencedInPrompt: true,
    priority: 'high',
  },

  tags: ['lexical', 'update', 'edit', 'block', 'modify'],
};
