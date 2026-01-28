/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Zod schema for deleteBlocks operation parameters.
 *
 * @module tools/schemas/deleteBlocks
 */

import { z } from 'zod';

export const deleteBlocksParamsSchema = z.object({
  ids: z
    .array(z.string().min(1))
    .min(1)
    .describe('Array of block IDs to delete'),
});

export type DeleteBlocksParams = z.infer<typeof deleteBlocksParamsSchema>;
