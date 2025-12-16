/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * AutoIndent Type Definitions
 *
 * Provides type-safe interfaces for language-aware code indentation.
 * Supports both heuristic-based (regex) and AST-based (tree-sitter) rule providers.
 *
 * @module autoindent/types
 */

/**
 * Rule for increasing indentation
 */
export interface IndentRule {
  /** Unique identifier for this rule */
  name: string;

  /** Pattern to match (regex for heuristic, tree-sitter query for AST) */
  pattern: RegExp;

  /** Where the pattern should match */
  context: 'line-end' | 'line-start' | 'anywhere';

  /** How many spaces to add (usually 1x tabSize) */
  indentAmount: number;

  /** Optional: only apply if previous line also matches this pattern */
  requiresPreviousMatch?: RegExp;
}

/**
 * Rule for decreasing indentation
 */
export interface DedentRule {
  /** Unique identifier for this rule */
  name: string;

  /** Pattern to match (e.g., Python 'return', 'break', etc.) */
  pattern: RegExp;

  /** Where the pattern should match */
  context: 'line-start' | 'anywhere';

  /** How many spaces to remove (usually 1x tabSize) */
  dedentAmount: number;
}

/**
 * Language-specific indentation configuration
 */
export interface LanguageIndentConfig {
  /** Language identifier (e.g., 'python', 'javascript') */
  language: string;

  /** Number of spaces for one indentation level */
  tabSize: number;

  /** Whether to use actual tab characters (vs spaces) */
  useTabs: boolean;

  /** Rules for when to automatically increase indentation */
  indentTriggers: IndentRule[];

  /** Rules for when to automatically decrease indentation */
  dedentTriggers: DedentRule[];

  /** Optional: Additional context-specific rules */
  customRules?: CustomIndentRule[];
}

/**
 * Custom indentation rule for special cases
 */
export interface CustomIndentRule {
  /** Rule name */
  name: string;

  /** When this rule applies */
  condition: (line: string, context: IndentContext) => boolean;

  /** What indentation to apply */
  apply: (currentIndent: number, context: IndentContext) => number;
}

/**
 * Context information for indentation calculation
 */
export interface IndentContext {
  /** Current line text */
  currentLine: string;

  /** Previous line text (if available) */
  previousLine?: string;

  /** Lines before current (for multi-line context) */
  previousLines?: string[];

  /** Current language */
  language: string;

  /** Current cursor position within the line */
  cursorPosition?: number;

  /** Current base indentation level (in spaces) */
  currentIndent: number;
}

/**
 * Result of indentation calculation
 */
export interface IndentResult {
  /** Number of spaces for indentation */
  spaces: number;

  /** Whether indentation should be increased */
  shouldIndent: boolean;

  /** Whether indentation should be decreased */
  shouldDedent: boolean;

  /** Optional: Reason for the indent decision (for debugging) */
  reason?: string;

  /** Optional: The rule that triggered this result */
  triggeredRule?: string;
}

/**
 * Interface for indent rule providers
 * Supports multiple implementations (heuristic, tree-sitter, etc.)
 */
export interface IndentRuleProvider {
  /** Provider name (e.g., 'heuristic', 'tree-sitter') */
  name: string;

  /** Check if this provider supports the given language */
  supportsLanguage(language: string): boolean;

  /** Calculate indentation for the given context */
  calculateIndent(context: IndentContext): IndentResult;

  /** Priority (higher = tried first) */
  priority: number;
}

/**
 * Options for configuring the AutoIndent system
 */
export interface AutoIndentOptions {
  /** Default language when none is specified */
  defaultLanguage?: string;

  /** Custom language configurations to register */
  customConfigs?: LanguageIndentConfig[];

  /** Enable debug logging */
  debug?: boolean;

  /** Fallback tab size if language unknown */
  fallbackTabSize?: number;

  /** Whether to preserve tabs as actual tab characters */
  preserveTabs?: boolean;
}
