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

export const blockCategorySchema = z.enum([
  'text',
  'heading',
  'code',
  'media',
  'list',
  'table',
  'jupyter',
]);

export const listAvailableBlocksParamsSchema = z.object({
  category: blockCategorySchema
    .optional()
    .describe('Optional category filter for block types'),
});

export type BlockCategory = z.infer<typeof blockCategorySchema>;
export type ListAvailableBlocksParams = z.infer<
  typeof listAvailableBlocksParamsSchema
>;
