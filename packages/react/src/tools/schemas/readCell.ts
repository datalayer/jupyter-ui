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
 * Coerces string numbers to actual numbers (LLMs often pass "0" instead of 0).
 */
export const readCellParamsSchema = z.object({
  index: z.preprocess(
    val => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().nonnegative().describe('Cell index (0-based)')
  ),
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
