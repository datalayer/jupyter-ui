/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Zod schema for executeCode operation parameters.
 *
 * @module tools/schemas/executeCode
 */

import { z } from 'zod';

export const executeCodeParamsSchema = z.object({
  code: z.string().min(1).describe('Code to execute in the kernel'),
  storeHistory: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to store execution in kernel history'),
  silent: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to suppress output'),
  stopOnError: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to stop execution on error'),
});

export type ExecuteCodeParams = z.infer<typeof executeCodeParamsSchema>;
