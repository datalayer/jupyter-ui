/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Zod schema for deleteBlock operation parameters.
 *
 * @module tools/schemas/deleteBlock
 */

import { z } from 'zod';

export const deleteBlockParamsSchema = z.object({
  ids: z
    .array(z.string().min(1))
    .min(1)
    .describe('Array of block IDs to delete'),
});

export type DeleteBlockParams = z.infer<typeof deleteBlockParamsSchema>;
