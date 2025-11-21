/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Zod schema for insertBlock operation parameters.
 *
 * @module tools/schemas/insertBlock
 */

import { z } from 'zod';

export const insertBlockParamsSchema = z.object({
  afterId: z
    .string()
    .describe(
      "Position to insert block: 'TOP' for beginning, 'BOTTOM' for end, or a specific block ID",
    ),
  type: z
    .string()
    .min(1)
    .describe("Block type (e.g., 'paragraph', 'heading', 'code', 'list-item')"),
  source: z.string().describe('Block source content'),
  properties: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('Optional block metadata and properties'),
});

export type InsertBlockParams = z.infer<typeof insertBlockParamsSchema>;
