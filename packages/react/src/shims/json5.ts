/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { parse as parseJsonc, printParseErrorCode } from 'jsonc-parser';

function offsetToLineColumn(
  source: string,
  offset: number
): { line: number; column: number } {
  const safeOffset = Math.max(0, Math.min(offset, source.length));
  const before = source.slice(0, safeOffset);
  const lines = before.split(/\r\n|\r|\n/);
  return {
    line: lines.length,
    column: (lines[lines.length - 1] || '').length + 1,
  };
}

export function parse(source: string): unknown {
  const errors: Array<{ error: number; offset: number; length: number }> = [];
  const parsed = parseJsonc(source, errors, {
    allowTrailingComma: true,
    disallowComments: false,
  });

  if (errors.length > 0) {
    const firstError = errors[0];
    const description = printParseErrorCode(firstError.error);
    const { line, column } = offsetToLineColumn(source, firstError.offset);
    const error = new Error(description) as Error & {
      description: string;
      lineNumber: number;
      column: number;
    };
    error.description = description;
    error.lineNumber = line;
    error.column = column;
    throw error;
  }

  return parsed;
}

export function stringify(
  value: unknown,
  replacer?: any,
  space?: string | number
): string {
  return JSON.stringify(value, replacer, space);
}

const json5 = {
  parse,
  stringify,
};

export default json5;
