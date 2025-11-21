/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Zod schema for updateBlock operation parameters.
 *
 * @module tools/schemas/updateBlock
 */

import { z } from 'zod';

export const updateBlockParamsSchema = z.object({
  id: z.string().min(1).describe('Block ID to update'),
  type: z
    .string()
    .min(1)
    .optional()
    .describe(
      "New block type (e.g., 'paragraph', 'heading', 'code', 'list-item')",
    ),
  source: z.string().optional().describe('New block source content'),
  properties: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('New block metadata and properties'),
});

export type UpdateBlockParams = z.infer<typeof updateBlockParamsSchema>;
