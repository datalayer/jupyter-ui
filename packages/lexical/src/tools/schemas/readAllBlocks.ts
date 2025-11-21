/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Zod schema for readAllBlocks operation parameters.
 *
 * @module tools/schemas/readAllBlocks
 */

import { z } from 'zod';

export const readAllBlocksParamsSchema = z.object({
  format: z.enum(['brief', 'detailed']).default('brief').optional(),
});

export type ReadAllBlocksParams = z.infer<typeof readAllBlocksParamsSchema>;
