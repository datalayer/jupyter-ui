/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Zod utility functions for tool parameter validation
 *
 * @module tools/core/zodUtils
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { ToolDefinition } from './schema';

/**
 * Converts a Zod schema to ToolDefinition parameters (JSON Schema format).
 *
 * This enables a single source of truth: define the schema once with Zod,
 * and automatically generate the JSON Schema for LLM tool calling.
 *
 * @param schema - Zod schema defining the tool's input parameters
 * @returns JSON Schema object compatible with ToolDefinition.parameters
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   index: z.number().int().describe('Cell index'),
 *   source: z.string().describe('Cell content')
 * });
 *
 * const parameters = zodToToolParameters(schema);
 * // Returns: { type: 'object', properties: {...}, required: [...] }
 * ```
 */
export function zodToToolParameters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: any
): ToolDefinition['parameters'] {
  // Generate JSON Schema from Zod schema
  const jsonSchema = zodToJsonSchema(schema, {
    target: 'openApi3',
    $refStrategy: 'none', // Inline all schemas (no $ref)
  }) as {
    properties?: Record<string, unknown>;
    required?: string[];
  };

  // Extract the core schema structure
  // zodToJsonSchema wraps the schema, we need to unwrap it
  const schemaProperties = jsonSchema.properties || {};
  const requiredFields = jsonSchema.required || [];

  return {
    type: 'object' as const,
    properties: schemaProperties,
    required: requiredFields,
  };
}

/**
 * Validates parameters using a Zod schema with user-friendly error messages.
 *
 * This replaces manual type guard functions with automatic runtime validation.
 * On validation failure, throws a descriptive error that helps both developers
 * and LLMs understand what went wrong.
 *
 * @param schema - Zod schema to validate against
 * @param params - Unknown parameters to validate
 * @param operationName - Name of the operation (for error messages)
 * @returns Validated parameters with proper TypeScript type
 * @throws Error with detailed validation failure information
 *
 * @example
 * ```typescript
 * const schema = z.object({ index: z.number().int() });
 *
 * // Valid params
 * const validated = validateWithZod(schema, { index: 5 }, 'readCell');
 * // Returns: { index: 5 } with type { index: number }
 *
 * // Invalid params
 * validateWithZod(schema, { index: 'invalid' }, 'readCell');
 * // Throws: Error: Invalid parameters for readCell:
 * //   - index: Expected number, received string
 * ```
 */
export function validateWithZod<T>(
  schema: z.ZodType<T>,
  params: unknown,
  operationName: string
): T {
  try {
    // Parse and validate parameters
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Convert Zod validation errors to user-friendly format
      const issues = error.issues
        .map(issue => {
          // Build path string (e.g., "cells[0].type" for nested errors)
          const path = issue.path.length > 0 ? issue.path.join('.') : 'root';

          return `  - ${path}: ${issue.message}`;
        })
        .join('\n');

      throw new Error(
        `Invalid parameters for ${operationName}:\n${issues}\n\n` +
          `Received: ${JSON.stringify(params)}`
      );
    }

    // Re-throw non-Zod errors
    throw error;
  }
}
