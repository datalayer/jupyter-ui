/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Response formatting utilities for tool operations.
 * Supports JSON (default, structured) and TOON (human/LLM-readable).
 *
 * @module tools/core/formatter
 */

import { encode } from '@toon-format/toon';

/**
 * Format tool response based on requested format.
 *
 * @template T - Type of the data being formatted
 * @param data - Tool result to format
 * @param format - Desired output format ("toon" default, or "json")
 * @returns Formatted response (string for TOON, object for JSON)
 *
 * @example
 * ```typescript
 * // TOON format (default) - returns human-readable string
 * const toonResult = formatResponse({ success: true, cells: [...] });
 * // Returns: "success: true\ncells:\n  - type: code\n    source: print('hello')\n..."
 *
 * // JSON format - returns structured object
 * const jsonResult = formatResponse({ success: true, cells: [...] }, "json");
 * // Returns: { success: true, cells: [...] }
 * ```
 */
export function formatResponse<T>(
  data: T,
  format?: 'json' | 'toon'
): T | string {
  // Return JSON (structured object) if explicitly requested
  if (format === 'json') {
    return data;
  }

  // Default to TOON format - encode as human/LLM-readable string
  // This is the default because most tool operations are called by LLMs
  return encode(data);
}
