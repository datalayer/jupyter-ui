/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * AutoIndent Module
 *
 * Language-aware automatic indentation for code cells.
 * Provides intelligent tab insertion and autoindent on Enter key.
 *
 * @module autoindent
 */

// Core exports
export { AutoIndentEngine } from './AutoIndentEngine';
export { LanguageIndentRegistry } from './LanguageIndentRegistry';

// Type exports
export type {
  IndentRule,
  DedentRule,
  LanguageIndentConfig,
  CustomIndentRule,
  IndentContext,
  IndentResult,
  IndentRuleProvider,
  AutoIndentOptions,
} from './types';

// Language configurations
export { pythonIndentConfig } from './languages/python';
export {
  javascriptIndentConfig,
  typescriptIndentConfig,
} from './languages/javascript';
