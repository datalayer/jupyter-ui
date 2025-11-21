/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Zod schema for readAllCells operation parameters
 *
 * @module tools/schemas/readAllCells
 */

import { z } from 'zod';

/**
 * Schema for readAllCells parameters
 */
export const readAllCellsParamsSchema = z.object({
  format: z.enum(['brief', 'detailed']).default('brief').optional(),
});

/**
 * TypeScript type inferred from Zod schema.
 */
export type ReadAllCellsParams = z.infer<typeof readAllCellsParamsSchema>;
