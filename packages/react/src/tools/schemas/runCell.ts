/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Zod schema for runCell operation parameters
 *
 * @module tools/schemas/runCell
 */

import { z } from 'zod';

/**
 * Schema for runCell parameters
 *
 * Validates optional cell index, timeout, streaming, and progress interval settings.
 */
export const runCellParamsSchema = z.object({
  index: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe(
      'Cell index to execute (0-based). If omitted, executes the currently active cell.'
    ),
  timeoutSeconds: z
    .number()
    .positive()
    .optional()
    .describe(
      'Execution timeout in seconds. If omitted, no timeout is enforced (normal Jupyter behavior).'
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
      'Progress update interval in seconds when stream=true (default: 5)'
    ),
});

/**
 * TypeScript type inferred from Zod schema.
 */
export type RunCellParams = z.infer<typeof runCellParamsSchema>;
