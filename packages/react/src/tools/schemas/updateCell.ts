/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Zod schema for updateCell operation parameters
 *
 * @module tools/schemas/updateCell
 */

import { z } from 'zod';

/**
 * Schema for updateCell parameters
 *
 * Validates cell index and new source content.
 * Coerces string numbers to actual numbers (LLMs often pass "0" instead of 0).
 */
export const updateCellParamsSchema = z.object({
  index: z.preprocess(
    val => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().nonnegative().describe('Cell index (0-based)')
  ),
  source: z.string().describe('New cell source content'),
});

/**
 * TypeScript type inferred from Zod schema.
 */
export type UpdateCellParams = z.infer<typeof updateCellParamsSchema>;
