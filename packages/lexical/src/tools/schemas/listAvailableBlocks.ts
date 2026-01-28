/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Zod schema for listAvailableBlocks operation parameters.
 *
 * @module tools/schemas/listAvailableBlocks
 */

import { z } from 'zod';

export const listAvailableBlocksParamsSchema = z.object({
  type: z.preprocess(val => {
    // Always default to 'all' if undefined, null, or empty string
    if (val === undefined || val === null || val === '') return 'all';
    return val;
  }, z.string().default('all').describe('Block type to filter (e.g., "youtube", "table", "paragraph") or "all" to return all available blocks. Default: "all".')),
});

export type ListAvailableBlocksParams = z.infer<
  typeof listAvailableBlocksParamsSchema
>;
