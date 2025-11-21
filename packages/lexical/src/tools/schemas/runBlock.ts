/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Zod schema for runBlock operation parameters.
 *
 * @module tools/schemas/runBlock
 */

import { z } from 'zod';

/**
 * Schema for runBlock parameters
 *
 * Validates block ID, timeout, streaming, and progress interval settings.
 */
export const runBlockParamsSchema = z.object({
  id: z.string().min(1).describe('Executable block ID to run'),
  timeoutSeconds: z
    .number()
    .positive()
    .optional()
    .describe(
      'Execution timeout in seconds. If omitted, no timeout is enforced (normal Jupyter behavior).',
    ),
  stream: z
    .boolean()
    .optional()
    .describe('Enable streaming progress updates (default: false)'),
  progressInterval: z
    .number()
    .positive()
    .optional()
    .describe(
      'Progress update interval in seconds when stream=true (default: 5)',
    ),
});

/**
 * TypeScript type inferred from Zod schema.
 */
export type RunBlockParams = z.infer<typeof runBlockParamsSchema>;
