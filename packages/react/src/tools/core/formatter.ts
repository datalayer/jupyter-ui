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
 * @param format - Desired output format ("json" or "toon")
 * @returns Formatted response (object for JSON, string for TOON)
 *
 * @example
 * ```typescript
 * // JSON format (default) - returns structured object
 * const jsonResult = formatResponse({ success: true, cells: [...] }, "json");
 * // Returns: { success: true, cells: [...] }
 *
 * // TOON format - returns human-readable string
 * const toonResult = formatResponse({ success: true, cells: [...] }, "toon");
 * // Returns: "success: true\ncells:\n  - type: code\n    source: print('hello')\n..."
 * ```
 */
export function formatResponse<T>(
  data: T,
  format?: 'json' | 'toon'
): T | string {
  // Default to JSON (structured object) if format not specified
  if (!format || format === 'json') {
    return data;
  }

  // TOON format - encode as human/LLM-readable string
  if (format === 'toon') {
    return encode(data);
  }

  // Fallback to JSON for unknown formats
  return data;
}
