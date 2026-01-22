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
  metadata: z.preprocess(val => {
    // Convert empty strings to undefined (common LLM mistake)
    if (val === '' || val === null) return undefined;
    // Convert non-object values to undefined
    if (typeof val !== 'object' || Array.isArray(val)) return undefined;
    return val;
  }, z.record(z.string(), z.unknown()).optional().describe('Optional block metadata (aligned with Jupyter format). CRITICAL: To insert blocks INSIDE a collapsible, set metadata.collapsible to the RETURNED BLOCK ID from inserting the collapsible container (a specific ID like "6", NOT position markers like "TOP" or "BOTTOM"). Example: {collapsible: "6"} inserts block inside collapsible with ID "6". Position markers (TOP/BOTTOM) are ONLY for the afterId parameter, never for metadata.collapsible.')),
});

export type InsertBlockParams = z.infer<typeof insertBlockParamsSchema>;
