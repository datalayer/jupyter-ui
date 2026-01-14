/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * JavaScript/TypeScript Language Indentation Configuration
 *
 * Implements common JavaScript formatting conventions:
 * - 2 spaces per indentation level (standard for JS/TS)
 * - Indent after opening braces
 * - Dedent on closing braces
 *
 * @module autoindent/languages/javascript
 */

import type { LanguageIndentConfig } from '../types';

/**
 * JavaScript indentation configuration
 */
export const javascriptIndentConfig: LanguageIndentConfig = {
  language: 'javascript',
  tabSize: 2,
  useTabs: false,

  indentTriggers: [
    {
      name: 'open-brace',
      // Matches lines ending with "{" (function/class/object/block start)
      // Examples: "function test() {", "if (x) {", "const obj = {"
      pattern: /\{\s*(\/\/.*)?$/,
      context: 'line-end',
      indentAmount: 2,
    },
    {
      name: 'open-bracket',
      // Matches lines ending with "[" (array literal continuation)
      // Example: "const arr = ["
      pattern: /\[\s*(\/\/.*)?$/,
      context: 'line-end',
      indentAmount: 2,
    },
    {
      name: 'open-paren',
      // Matches lines ending with "(" (function call/parameter continuation)
      // Example: "someFunction("
      pattern: /\(\s*(\/\/.*)?$/,
      context: 'line-end',
      indentAmount: 2,
    },
    {
      name: 'arrow-function',
      // Matches lines ending with "=>" (arrow function without brace)
      // Example: "const func = () =>"
      pattern: /=>\s*(\/\/.*)?$/,
      context: 'line-end',
      indentAmount: 2,
    },
    {
      name: 'ternary-operator',
      // Matches lines ending with "?" (ternary operator continuation)
      // Example: "const result = condition ?"
      pattern: /\?\s*(\/\/.*)?$/,
      context: 'line-end',
      indentAmount: 2,
    },
  ],

  dedentTriggers: [
    {
      name: 'return-statement',
      // Matches lines starting with 'return'
      pattern: /^\s*return(\s|;)/,
      context: 'line-start',
      dedentAmount: 2,
    },
    {
      name: 'break-continue',
      // Matches break or continue statements
      pattern: /^\s*(break|continue)(\s|;)/,
      context: 'line-start',
      dedentAmount: 2,
    },
    {
      name: 'throw-statement',
      // Matches throw statements
      pattern: /^\s*throw(\s|;)/,
      context: 'line-start',
      dedentAmount: 2,
    },
  ],

  customRules: [
    {
      name: 'close-brace-dedent',
      condition: (line: string) => {
        // Check if line starts with closing brace
        return /^\s*}/.test(line);
      },
      apply: (currentIndent: number) => {
        // Dedent by one level when closing brace
        return Math.max(0, currentIndent - 2);
      },
    },
    {
      name: 'close-bracket-dedent',
      condition: (line: string) => {
        // Check if line starts with closing bracket
        return /^\s*\]/.test(line);
      },
      apply: (currentIndent: number) => {
        // Dedent by one level when closing bracket
        return Math.max(0, currentIndent - 2);
      },
    },
    {
      name: 'close-paren-dedent',
      condition: (line: string) => {
        // Check if line starts with closing paren
        return /^\s*\)/.test(line);
      },
      apply: (currentIndent: number) => {
        // Dedent by one level when closing paren
        return Math.max(0, currentIndent - 2);
      },
    },
    {
      name: 'case-label',
      condition: (line: string) => {
        // Check if line is a case or default label in switch statement
        return /^\s*(case\s+.*:|default:)/.test(line);
      },
      apply: (currentIndent: number, _context) => {
        // Case labels are typically at the same level as switch
        // This is a simplified heuristic
        return currentIndent;
      },
    },
  ],
};

/**
 * TypeScript uses same indentation rules as JavaScript
 */
const typescriptIndentConfig: LanguageIndentConfig = {
  ...javascriptIndentConfig,
  language: 'typescript',
};

/**
 * Helper function to check if a line is a JavaScript comment
 */
export function isJavaScriptComment(line: string): boolean {
  return /^\s*(\/\/|\/\*)/.test(line);
}

/**
 * Helper function to check if we're inside a template literal
 * Note: This is a heuristic; accurate detection requires AST analysis
 */
export function isInTemplateLiteral(line: string): boolean {
  // Simple heuristic: count backticks before this line
  const backticks = (line.match(/`/g) || []).length;
  return backticks % 2 !== 0;
}

export default javascriptIndentConfig;
export { typescriptIndentConfig };
