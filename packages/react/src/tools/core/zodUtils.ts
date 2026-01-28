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
  // Manual conversion for Zod v3/v4 compatibility
  // zod-to-json-schema@3.x doesn't fully support Zod v4
  // Handle both Zod v3 (_def.type === 'object') and Zod v4 (_def.typeName === 'ZodObject')
  const isZodObject =
    schema?._def?.typeName === 'ZodObject' || schema?._def?.type === 'object';

  if (isZodObject && schema._def?.shape) {
    // Get shape object - handle both Zod v3 (shape is object) and Zod v4 (shape is function)
    const shape =
      typeof schema._def.shape === 'function'
        ? schema._def.shape()
        : schema._def.shape;
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      let zodField = value as any;

      // Build property schema
      const prop: Record<string, any> = {};

      // Unwrap optional/default/effects/pipe modifiers to get to the base type
      // Support both Zod v3 (def/def) and Zod v4 (_def)
      let isOptional = false;
      while (
        zodField._def?.typeName === 'ZodOptional' ||
        zodField._def?.typeName === 'ZodDefault' ||
        zodField._def?.typeName === 'ZodEffects' ||
        zodField._def?.type === 'optional' ||
        zodField._def?.type === 'default' ||
        zodField._def?.type === 'effects' ||
        zodField._def?.type === 'pipe' ||
        zodField.def?.type === 'optional' ||
        zodField.def?.type === 'default' ||
        zodField.def?.type === 'effects' ||
        zodField.def?.type === 'pipe'
      ) {
        if (
          zodField._def?.typeName === 'ZodOptional' ||
          zodField._def?.type === 'optional' ||
          zodField.def?.type === 'optional'
        ) {
          isOptional = true;
        }
        // Unwrap to get the inner type - try all possible paths
        // For Zod v4 pipe (preprocess): use _def.out
        // For ZodEffects: use _def.schema
        // For optional/default: use _def.innerType
        zodField =
          zodField._def?.out ||
          zodField._def?.schema ||
          zodField._def?.innerType ||
          zodField.def?.innerType ||
          zodField;
      }

      // Extract description (check at each level)
      // Support both Zod v3 (def.description) and Zod v4 (_def.description)
      const description =
        (value as any)._def?.description ||
        (value as any).def?.description ||
        (value as any).description;
      if (description) {
        prop.description = description;
      }

      // Handle type based on unwrapped field
      // Support both Zod v3 (def.type) and Zod v4 (_def.typeName or _def.type)
      const typeName =
        zodField._def?.typeName || zodField._def?.type || zodField.def?.type;
      if (typeName === 'ZodString' || typeName === 'string') {
        prop.type = 'string';
      } else if (typeName === 'ZodNumber' || typeName === 'number') {
        prop.type = 'number';
      } else if (typeName === 'ZodBoolean' || typeName === 'boolean') {
        prop.type = 'boolean';
      } else if (typeName === 'ZodArray' || typeName === 'array') {
        prop.type = 'array';
        // Get the inner element type of the array
        // Zod v4 uses _def.element (NOT _def.type which is the string "ZodArray")
        // Zod v3 uses def.element
        let innerType = zodField._def?.element || zodField.def?.element;

        // Unwrap ZodEffects/pipe (preprocess) to get actual type
        // Zod v4 uses type: "pipe" with _def.out for the output schema
        // Zod v3 uses type: "effects" with _def.schema
        let iterations = 0;
        while (innerType && iterations < 10) {
          iterations++;
          const effectType = innerType._def?.type || innerType.def?.type;
          const effectTypeName = innerType._def?.typeName;

          if (
            effectType === 'pipe' ||
            effectType === 'effects' ||
            effectTypeName === 'ZodEffects'
          ) {
            // Zod v4 pipe: output schema is in _def.out
            // Zod v3 effects: output schema is in _def.schema
            innerType =
              innerType._def?.out ||
              innerType._def?.schema ||
              innerType.def?.schema ||
              innerType;
          } else {
            break;
          }
        }

        const innerTypeName =
          innerType?._def?.typeName ||
          innerType?._def?.type ||
          innerType?.def?.type;
        // Map inner type to JSON Schema item type
        if (innerTypeName === 'ZodString' || innerTypeName === 'string') {
          prop.items = { type: 'string' };
        } else if (
          innerTypeName === 'ZodNumber' ||
          innerTypeName === 'number'
        ) {
          prop.items = { type: 'number' };
        } else if (
          innerTypeName === 'ZodBoolean' ||
          innerTypeName === 'boolean'
        ) {
          prop.items = { type: 'boolean' };
        } else {
          // Default to string items for unknown inner types
          prop.items = { type: 'string' };
        }
      } else if (typeName === 'ZodEnum' || typeName === 'enum') {
        prop.type = 'string';
        // Enum values can be in different places depending on Zod version:
        // - Zod v4: _def.values (array)
        // - Zod v3: def.entries (object), options (array), or enum (object)
        const enumValues =
          zodField._def?.values ||
          zodField.def?.values ||
          zodField.options ||
          (zodField.def?.entries ? Object.keys(zodField.def.entries) : null) ||
          (zodField.enum ? Object.keys(zodField.enum) : null) ||
          [];
        prop.enum = Array.isArray(enumValues)
          ? enumValues
          : Object.keys(enumValues || {});
      } else if (typeName === 'ZodRecord' || typeName === 'record') {
        // Handle z.record() which creates a dictionary/object with string keys
        // Convert to JSON Schema object type
        prop.type = 'object';
        // ZodRecord allows arbitrary keys, so we don't specify additionalProperties: false
        // This is equivalent to { "type": "object" } in JSON Schema
      } else {
        // Fallback: Default to string type for unknown types to ensure valid JSON Schema
        prop.type = 'string';
      }

      properties[key] = prop;

      // Mark as required if not optional
      if (!isOptional) {
        required.push(key);
      }
    }

    return {
      type: 'object' as const,
      properties,
      required,
    };
  }

  // Fallback to zod-to-json-schema for other schema types
  // Note: This may not work correctly with Zod v4
  const jsonSchema = zodToJsonSchema(schema, {
    target: 'openApi3',
    $refStrategy: 'none',
  }) as {
    properties?: Record<string, unknown>;
    required?: string[];
  };

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
