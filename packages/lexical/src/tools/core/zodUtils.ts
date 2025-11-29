/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Zod utility functions for tool parameter validation and JSON Schema generation.
 *
 * @module tools/core/zodUtils
 */

import { z, type ZodIssue } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { ToolDefinition } from '@datalayer/jupyter-react/lib/tools/core';

/**
 * Validates parameters against a Zod schema and returns typed result.
 *
 * @param schema - Zod schema to validate against
 * @param params - Parameters to validate (unknown type from external source)
 * @param operationName - Name of the operation (for error messages)
 * @returns Validated and typed parameters
 * @throws {Error} If validation fails with detailed error message
 */
export function validateWithZod<T>(
  schema: z.ZodType<T>,
  params: unknown,
  operationName: string,
): T {
  const result = schema.safeParse(params);

  if (!result.success) {
    const errors = result.error.issues
      .map((err: ZodIssue) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');

    throw new Error(`Invalid parameters for ${operationName}: ${errors}`);
  }

  return result.data;
}

/**
 * Converts a Zod schema to JSON Schema format for tool definitions.
 *
 * This generates the `parameters` field for ToolDefinition objects,
 * which is used by LLM tool calling systems (CopilotKit, etc.).
 *
 * @param schema - Zod schema to convert
 * @returns JSON Schema object compatible with ToolDefinition.parameters
 */
export function zodToToolParameters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: any,
): ToolDefinition['parameters'] {
  const jsonSchema = zodToJsonSchema(schema, {
    target: 'jsonSchema7',
    $refStrategy: 'none',
  });

  // Extract the properties and required fields from the JSON Schema
  // zodToJsonSchema wraps it in definitions, we just want the schema itself
  return jsonSchema as ToolDefinition['parameters'];
}
