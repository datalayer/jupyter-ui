/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Python Language Indentation Configuration
 *
 * Implements PEP 8 indentation rules:
 * - 4 spaces per indentation level
 * - Indent after colons (if, for, def, class, try, with, etc.)
 * - Dedent for flow control keywords (return, break, continue, pass)
 *
 * @module autoindent/languages/python
 */

import type { LanguageIndentConfig } from '../types';

/**
 * Python indentation configuration (PEP 8)
 */
export const pythonIndentConfig: LanguageIndentConfig = {
  language: 'python',
  tabSize: 4,
  useTabs: false,

  indentTriggers: [
    {
      name: 'colon-indent',
      // Matches lines ending with ":" (optionally followed by comment or whitespace)
      // Examples: "if x > 0:", "def foo():", "class MyClass:", "try:", "with open() as f:"
      pattern: /:\s*(#.*)?$/,
      context: 'line-end',
      indentAmount: 4,
    },
    {
      name: 'continuation-backslash',
      // Matches lines ending with backslash (line continuation)
      // Example: "result = some_function() \"
      pattern: /\\\s*(#.*)?$/,
      context: 'line-end',
      indentAmount: 4,
    },
    {
      name: 'open-bracket',
      // Matches lines with unclosed brackets/parens/braces
      // Example: "result = my_function("
      // Note: This is a simple heuristic; proper bracket matching requires AST
      pattern: /[[({]\s*$/,
      context: 'line-end',
      indentAmount: 4,
    },
  ],

  dedentTriggers: [
    {
      name: 'flow-control-keywords',
      // Matches lines starting with return, break, continue, or pass
      // These typically signal the end of an indented block
      pattern: /^\s*(return|break|continue|pass)(\s|$)/,
      context: 'line-start',
      dedentAmount: 4,
    },
    {
      name: 'raise-keyword',
      // Matches lines starting with 'raise'
      pattern: /^\s*raise(\s|$)/,
      context: 'line-start',
      dedentAmount: 4,
    },
  ],

  customRules: [
    {
      name: 'close-bracket-dedent',
      condition: (line: string) => {
        // Check if line starts with closing bracket
        return /^\s*[\])}]/.test(line);
      },
      apply: (currentIndent: number) => {
        // Dedent by one level when closing bracket
        return Math.max(0, currentIndent - 4);
      },
    },
  ],
};

/**
 * Helper function to check if a line is a Python comment
 */
export function isPythonComment(line: string): boolean {
  return /^\s*#/.test(line);
}

/**
 * Helper function to check if a line is part of a multi-line string
 * Note: This is a heuristic; accurate detection requires AST analysis
 */
export function isInMultilineString(line: string): boolean {
  // Simple heuristic: count triple quotes before this line
  const tripleQuotes = (line.match(/"""|'''/g) || []).length;
  return tripleQuotes % 2 !== 0;
}

/**
 * Helper function to check if colon is inside a string or comment
 * This prevents false positives like: print("Hello: World")
 */
export function isColonInStringOrComment(line: string): boolean {
  // Remove strings (both single and double quoted)
  let cleaned = line.replace(/'[^']*'/g, '').replace(/"[^"]*"/g, '');

  // Remove comments
  const commentIndex = cleaned.indexOf('#');
  if (commentIndex !== -1) {
    cleaned = cleaned.substring(0, commentIndex);
  }

  // Check if colon exists in the cleaned line
  return !cleaned.includes(':');
}

export default pythonIndentConfig;
