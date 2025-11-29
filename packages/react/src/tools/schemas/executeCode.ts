/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Zod schema for executeCode operation parameters
 *
 * @module tools/schemas/executeCode
 */

import { z } from 'zod';

/**
 * Schema for executeCode parameters
 *
 * Validates code string and optional timeout with range constraint.
 */
export const executeCodeParamsSchema = z.object({
  code: z
    .string()
    .describe(
      'Code to execute (supports magic commands with %, shell commands with !)'
    ),
  timeout: z
    .number()
    .min(0)
    .max(60)
    .optional()
    .describe('Execution timeout in seconds (default: 30, maximum: 60)'),
});

/**
 * TypeScript type inferred from Zod schema.
 */
export type ExecuteCodeParams = z.infer<typeof executeCodeParamsSchema>;
