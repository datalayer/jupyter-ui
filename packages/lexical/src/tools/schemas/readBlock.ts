/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Zod schema for readBlock operation parameters.
 *
 * @module tools/schemas/readBlock
 */

import { z } from 'zod';

export const readBlockParamsSchema = z.object({
  id: z.string().min(1).describe('Block ID to read'),
});

export type ReadBlockParams = z.infer<typeof readBlockParamsSchema>;
