/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Zod schema for deleteCell operation parameters
 *
 * @module tools/schemas/deleteCell
 */

import { z } from 'zod';

/**
 * Schema for deleteCell parameters
 *
 * Validates that indices is a non-empty array of non-negative integers.
 */
export const deleteCellParamsSchema = z.object({
  indices: z
    .array(z.number().int().nonnegative())
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
export type DeleteCellParams = z.infer<typeof deleteCellParamsSchema>;
