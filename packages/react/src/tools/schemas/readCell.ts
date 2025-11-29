/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Zod schema for readCell operation parameters
 *
 * @module tools/schemas/readCell
 */

import { z } from 'zod';

/**
 * Schema for readCell parameters
 *
 * Validates cell index and optional output inclusion flag.
 */
export const readCellParamsSchema = z.object({
  index: z.number().int().nonnegative().describe('Cell index (0-based)'),
  includeOutputs: z
    .boolean()
    .optional()
    .describe(
      'Whether to include cell outputs in the response (default: true)'
    ),
});

/**
 * TypeScript type inferred from Zod schema.
 */
export type ReadCellParams = z.infer<typeof readCellParamsSchema>;
