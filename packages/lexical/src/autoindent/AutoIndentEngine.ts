/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * AutoIndent Engine
 *
 * Core logic for calculating language-aware code indentation.
 * Processes indent/dedent rules and applies them based on line content.
 *
 * @module autoindent/AutoIndentEngine
 */

import type {
  IndentContext,
  IndentResult,
  IndentRule,
  DedentRule,
} from './types';
import { LanguageIndentRegistry } from './LanguageIndentRegistry';

/**
 * Engine for calculating intelligent code indentation
 *
 * Uses language-specific rules to determine appropriate indentation
 * based on line content and context.
 *
 * @example
 * ```typescript
 * const registry = new LanguageIndentRegistry();
 * const engine = new AutoIndentEngine(registry);
 *
 * const result = engine.calculateIndent({
 *   currentLine: 'if x > 0:',
 *   language: 'python',
 *   currentIndent: 0,
 * });
 *
 * console.log(result.spaces); // 4
 * console.log(result.shouldIndent); // true
 * ```
 */
export class AutoIndentEngine {
  private registry: LanguageIndentRegistry;
  // @ts-expect-error - Debug field preserved for future use, logging currently disabled
  private _debug: boolean;

  /**
   * Create a new autoindent engine
   *
   * @param registry - Language configuration registry
   * @param debug - Enable debug logging (currently unused - logging disabled)
   */
  constructor(registry: LanguageIndentRegistry, debug = false) {
    this.registry = registry;
    this._debug = debug;
  }

  /**
   * Calculate indentation for a new line based on current line context
   *
   * @param context - Indentation context
   * @returns Indent result with spaces and indent/dedent flags
   */
  calculateIndent(context: IndentContext): IndentResult {
    const config = this.registry.getConfigOrDefault(context.language);

    // Get base indentation from current line
    const currentLineIndent = this.getLeadingWhitespaceCount(
      context.currentLine,
    );

    // Start with current indentation
    let resultSpaces = currentLineIndent;
    let shouldIndent = false;
    let shouldDedent = false;
    let triggeredRule: string | undefined;

    // Check indent triggers
    for (const rule of config.indentTriggers) {
      if (this.matchesIndentRule(context.currentLine, rule)) {
        resultSpaces = currentLineIndent + rule.indentAmount;
        shouldIndent = true;
        triggeredRule = rule.name;
        break; // Use first matching rule
      }
    }

    // Check dedent triggers (only if no indent trigger matched)
    if (!shouldIndent) {
      for (const rule of config.dedentTriggers) {
        if (this.matchesDedentRule(context.currentLine, rule)) {
          // Note: Dedent triggers indicate that the NEXT line after the current
          // line should be dedented. The current line maintains its indent.
          shouldDedent = true;
          triggeredRule = rule.name;
          break;
        }
      }
    }

    // Apply custom rules
    if (config.customRules) {
      for (const customRule of config.customRules) {
        if (customRule.condition(context.currentLine, context)) {
          resultSpaces = customRule.apply(resultSpaces, context);
          break; // Use first matching custom rule
        }
      }
    }

    // Ensure we never go negative
    resultSpaces = Math.max(0, resultSpaces);

    const result: IndentResult = {
      spaces: resultSpaces,
      shouldIndent,
      shouldDedent,
      triggeredRule,
    };

    return result;
  }

  /**
   * Get tab string for a language (either spaces or actual tab character)
   *
   * @param language - Language identifier
   * @returns String to insert for one tab press
   */
  getTabString(language: string | null | undefined): string {
    const config = this.registry.getConfigOrDefault(language);

    if (config.useTabs) {
      return '\t';
    }

    return ' '.repeat(config.tabSize);
  }

  /**
   * Get tab size (number of spaces) for a language
   *
   * @param language - Language identifier
   * @returns Number of spaces per indentation level
   */
  getTabSize(language: string | null | undefined): number {
    const config = this.registry.getConfigOrDefault(language);
    return config.tabSize;
  }

  /**
   * Calculate indentation for outdenting (Shift+Tab or dedent)
   *
   * @param currentIndent - Current indentation in spaces
   * @param language - Language identifier
   * @returns New indentation level after outdent
   */
  calculateOutdent(
    currentIndent: number,
    language: string | null | undefined,
  ): number {
    const config = this.registry.getConfigOrDefault(language);
    const newIndent = currentIndent - config.tabSize;

    return Math.max(0, newIndent);
  }

  /**
   * Get leading whitespace count from a line
   *
   * @param line - Line of text
   * @returns Number of leading whitespace characters (spaces and tabs)
   */
  private getLeadingWhitespaceCount(line: string): number {
    const match = line.match(/^[\t ]*/);
    if (!match) {
      return 0;
    }

    const whitespace = match[0];
    let count = 0;

    for (const char of whitespace) {
      if (char === '\t') {
        // Count tab as 4 spaces (or configured tab size)
        // Note: This is a simplification; actual tab width depends on config
        count += 4;
      } else {
        count += 1;
      }
    }

    return count;
  }

  /**
   * Get leading whitespace string from a line
   *
   * @param line - Line of text
   * @returns Leading whitespace characters
   */
  getLeadingWhitespace(line: string): string {
    const match = line.match(/^[\t ]*/);
    return match ? match[0] : '';
  }

  /**
   * Check if a line matches an indent rule
   *
   * @param line - Line of text
   * @param rule - Indent rule to check
   * @returns True if line matches the rule
   */
  private matchesIndentRule(line: string, rule: IndentRule): boolean {
    switch (rule.context) {
      case 'line-end':
        return rule.pattern.test(line);

      case 'line-start':
        return rule.pattern.test(line);

      case 'anywhere':
        return rule.pattern.test(line);

      default:
        return false;
    }
  }

  /**
   * Check if a line matches a dedent rule
   *
   * @param line - Line of text
   * @param rule - Dedent rule to check
   * @returns True if line matches the rule
   */
  private matchesDedentRule(line: string, rule: DedentRule): boolean {
    switch (rule.context) {
      case 'line-start':
        return rule.pattern.test(line);

      case 'anywhere':
        return rule.pattern.test(line);

      default:
        return false;
    }
  }

  /**
   * Normalize indentation to use consistent spacing
   * Converts tabs to spaces based on language config
   *
   * @param line - Line of text
   * @param language - Language identifier
   * @returns Line with normalized indentation
   */
  normalizeIndentation(
    line: string,
    language: string | null | undefined,
  ): string {
    const config = this.registry.getConfigOrDefault(language);

    if (config.useTabs) {
      // Convert spaces to tabs
      const leadingSpaces = this.getLeadingWhitespace(line);
      const spaceCount = leadingSpaces.length;
      const tabCount = Math.floor(spaceCount / config.tabSize);
      const remainingSpaces = spaceCount % config.tabSize;

      const normalized =
        '\t'.repeat(tabCount) +
        ' '.repeat(remainingSpaces) +
        line.substring(leadingSpaces.length);

      return normalized;
    } else {
      // Convert tabs to spaces
      const leadingWhitespace = this.getLeadingWhitespace(line);
      const normalized = leadingWhitespace
        .replace(/\t/g, ' '.repeat(config.tabSize))
        .concat(line.substring(leadingWhitespace.length));

      return normalized;
    }
  }
}

export default AutoIndentEngine;
