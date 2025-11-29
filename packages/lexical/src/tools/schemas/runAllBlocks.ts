/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Zod schema for runAllBlocks operation parameters.
 *
 * @module tools/schemas/runAllBlocks
 */

import { z } from 'zod';

export const runAllBlocksParamsSchema = z.object({
  // Empty schema - reserved for future parameters like execution options
});

export type RunAllBlocksParams = z.infer<typeof runAllBlocksParamsSchema>;
