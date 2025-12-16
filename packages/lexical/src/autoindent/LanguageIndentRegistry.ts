/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Language Indentation Registry
 *
 * Central registry for managing language-specific indentation configurations.
 * Supports registration, retrieval, and updating of language configs.
 *
 * @module autoindent/LanguageIndentRegistry
 */

import type { LanguageIndentConfig, AutoIndentOptions } from './types';
import { pythonIndentConfig } from './languages/python';
import {
  javascriptIndentConfig,
  typescriptIndentConfig,
} from './languages/javascript';

/**
 * Registry for language indentation configurations
 *
 * Manages a collection of language-specific indent rules and provides
 * methods to register, retrieve, and update configurations.
 *
 * @example
 * ```typescript
 * const registry = new LanguageIndentRegistry();
 * const config = registry.getConfig('python');
 * console.log(config.tabSize); // 4
 * ```
 */
export class LanguageIndentRegistry {
  private configs: Map<string, LanguageIndentConfig>;
  private options: AutoIndentOptions;

  /**
   * Create a new language indent registry
   *
   * @param options - Configuration options
   */
  constructor(options: AutoIndentOptions = {}) {
    this.configs = new Map();
    this.options = {
      defaultLanguage: 'python',
      fallbackTabSize: 4,
      debug: false,
      ...options,
    };

    // Register default languages
    this.registerDefaultLanguages();

    // Register any custom configs provided
    if (options.customConfigs) {
      options.customConfigs.forEach(config => this.registerLanguage(config));
    }
  }

  /**
   * Register default language configurations
   * Currently supports: Python, JavaScript, TypeScript
   */
  private registerDefaultLanguages(): void {
    this.registerLanguage(pythonIndentConfig);
    this.registerLanguage(javascriptIndentConfig);
    this.registerLanguage(typescriptIndentConfig);

    // Add common language aliases
    this.registerAlias('py', 'python');
    this.registerAlias('js', 'javascript');
    this.registerAlias('ts', 'typescript');
    this.registerAlias('jsx', 'javascript');
    this.registerAlias('tsx', 'typescript');
  }

  /**
   * Register a language configuration
   *
   * @param config - Language indent configuration
   * @throws Error if language already registered (use updateConfig to modify)
   */
  registerLanguage(config: LanguageIndentConfig): void {
    if (this.configs.has(config.language)) {
      if (this.options.debug) {
        console.warn(
          `[LanguageIndentRegistry] Language '${config.language}' already registered. Use updateConfig() to modify.`,
        );
      }
      return;
    }

    this.configs.set(config.language, config);

    if (this.options.debug) {
      console.log(
        `[LanguageIndentRegistry] Registered language: ${config.language} (tabSize=${config.tabSize})`,
      );
    }
  }

  /**
   * Register a language alias
   * Example: 'py' -> 'python', 'js' -> 'javascript'
   *
   * @param alias - Short alias name
   * @param targetLanguage - Full language name
   */
  registerAlias(alias: string, targetLanguage: string): void {
    const config = this.configs.get(targetLanguage);
    if (config) {
      this.configs.set(alias, config);
    }
  }

  /**
   * Get configuration for a language
   *
   * @param language - Language identifier
   * @returns Language config or undefined if not found
   */
  getConfig(
    language: string | null | undefined,
  ): LanguageIndentConfig | undefined {
    if (!language) {
      return this.getConfig(this.options.defaultLanguage);
    }

    // Normalize language name (lowercase, trim)
    const normalized = language.toLowerCase().trim();

    return this.configs.get(normalized);
  }

  /**
   * Get configuration for a language with fallback to default
   *
   * @param language - Language identifier
   * @returns Language config (never undefined - returns default if not found)
   */
  getConfigOrDefault(
    language: string | null | undefined,
  ): LanguageIndentConfig {
    const config = this.getConfig(language);

    if (config) {
      return config;
    }

    // Fallback to default language
    const defaultConfig = this.getConfig(this.options.defaultLanguage);
    if (defaultConfig) {
      if (this.options.debug) {
        console.warn(
          `[LanguageIndentRegistry] Language '${language}' not found, using default: ${this.options.defaultLanguage}`,
        );
      }
      return defaultConfig;
    }

    // Ultimate fallback: create minimal config
    if (this.options.debug) {
      console.error(
        `[LanguageIndentRegistry] No config found for '${language}' and default '${this.options.defaultLanguage}' missing!`,
      );
    }

    return this.createFallbackConfig(language || 'unknown');
  }

  /**
   * Create a minimal fallback configuration
   */
  private createFallbackConfig(language: string): LanguageIndentConfig {
    return {
      language,
      tabSize: this.options.fallbackTabSize || 4,
      useTabs: this.options.preserveTabs || false,
      indentTriggers: [],
      dedentTriggers: [],
    };
  }

  /**
   * Check if a language is registered
   *
   * @param language - Language identifier
   * @returns True if language has a configuration
   */
  hasLanguage(language: string | null | undefined): boolean {
    if (!language) {
      return false;
    }

    const normalized = language.toLowerCase().trim();
    return this.configs.has(normalized);
  }

  /**
   * Update an existing language configuration
   *
   * @param language - Language identifier
   * @param updates - Partial configuration to merge
   * @returns True if update successful, false if language not found
   */
  updateConfig(
    language: string,
    updates: Partial<LanguageIndentConfig>,
  ): boolean {
    const normalized = language.toLowerCase().trim();
    const existing = this.configs.get(normalized);

    if (!existing) {
      if (this.options.debug) {
        console.warn(
          `[LanguageIndentRegistry] Cannot update '${language}' - not registered`,
        );
      }
      return false;
    }

    const updated: LanguageIndentConfig = {
      ...existing,
      ...updates,
      language: existing.language, // Preserve original language name
    };

    this.configs.set(normalized, updated);

    if (this.options.debug) {
      console.log(
        `[LanguageIndentRegistry] Updated config for: ${language}`,
        updates,
      );
    }

    return true;
  }

  /**
   * Get list of all registered languages
   *
   * @returns Array of language identifiers
   */
  getRegisteredLanguages(): string[] {
    return Array.from(this.configs.keys());
  }

  /**
   * Clear all registered configurations
   * Useful for testing
   */
  clear(): void {
    this.configs.clear();

    if (this.options.debug) {
      console.log('[LanguageIndentRegistry] Cleared all configurations');
    }
  }

  /**
   * Reset to default configurations
   * Removes custom configs but keeps built-in languages
   */
  reset(): void {
    this.clear();
    this.registerDefaultLanguages();

    if (this.options.debug) {
      console.log('[LanguageIndentRegistry] Reset to default configurations');
    }
  }
}

export default LanguageIndentRegistry;
