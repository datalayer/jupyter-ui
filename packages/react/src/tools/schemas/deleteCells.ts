/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Zod schema for deleteCells operation parameters
 *
 * @module tools/schemas/deleteCells
 */

import { z } from 'zod';

/**
 * Schema for deleteCells parameters
 *
 * Validates that indices is a non-empty array of non-negative integers.
 * Coerces string numbers to actual numbers (LLMs often pass "0" instead of 0).
 */
export const deleteCellsParamsSchema = z.object({
  indices: z
    .array(
      z.preprocess(
        val => (typeof val === 'string' ? parseInt(val, 10) : val),
        z.number().int().nonnegative()
      )
    )
    .min(1)
    .describe(
      'Array of cell indices (0-based) to delete. ' +
        'Cells will be deleted in reverse order (highest index first) to prevent index shifting.'
    ),
});

/**
 * TypeScript type inferred from Zod schema.
 *
 * This replaces the manual interface definition and is guaranteed to stay in sync with the schema.
 */
export type DeleteCellsParams = z.infer<typeof deleteCellsParamsSchema>;
