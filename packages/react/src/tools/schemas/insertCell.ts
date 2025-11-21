/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Zod schema for insertCell operation parameters
 *
 * @module tools/schemas/insertCell
 */

import { z } from 'zod';

/**
 * Schema for insertCell parameters
 *
 * Validates cell type, source content, and optional insertion index.
 */
export const insertCellParamsSchema = z.object({
  type: z
    .enum(['code', 'markdown', 'raw'])
    .describe("Cell type: 'code', 'markdown', or 'raw'"),
  source: z.string().describe('Cell source content'),
  index: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe(
      'Insert position (0-based index). If omitted, cell is inserted at the end.'
    ),
});

/**
 * TypeScript type inferred from Zod schema.
 */
export type InsertCellParams = z.infer<typeof insertCellParamsSchema>;
