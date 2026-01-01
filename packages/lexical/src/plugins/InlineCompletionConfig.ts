/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Configuration schema for inline completions.
 * Supports both code and prose content types with flexible triggering and context options.
 */

/**
 * Content type for inline completions.
 * - 'code': Jupyter cell code completions
 * - 'prose': Natural language/markdown text completions
 */
export type ContentType = 'code' | 'prose';

/**
 * Trigger mode for inline completions.
 * - 'auto': Automatically trigger after typing (debounced)
 * - 'manual': Only trigger via keyboard shortcut
 * - 'disabled': Disable completions for this content type
 */
export type TriggerMode = 'auto' | 'manual' | 'disabled';

/**
 * Context scope for completions.
 * - N >= 0: Include N blocks before/after cursor
 * - -1: Include entire document (all blocks)
 */
export type ContextScope = number;

/**
 * Configuration for a specific content type.
 */
export interface ContentTypeConfig {
  /**
   * How completions should be triggered.
   * @default 'auto' for code, 'manual' for prose
   */
  triggerMode: TriggerMode;

  /**
   * Number of blocks to include before cursor.
   * Use -1 for entire document.
   * @default -1 (entire document)
   */
  contextBefore: ContextScope;

  /**
   * Number of blocks to include after cursor.
   * Use -1 for entire document.
   * @default -1 (entire document)
   */
  contextAfter: ContextScope;

  /**
   * Programming language for code completions.
   * Only applicable for 'code' content type.
   * @default 'python'
   */
  language?: string;
}

/**
 * Complete inline completion configuration.
 */
export interface InlineCompletionConfig {
  /**
   * Configuration for code (Jupyter cell) completions.
   */
  code: ContentTypeConfig;

  /**
   * Configuration for prose (natural language) completions.
   */
  prose: ContentTypeConfig;

  /**
   * Debounce delay in milliseconds for auto-trigger mode.
   * @default 200
   */
  debounceMs: number;

  /**
   * Keyboard shortcut for manual trigger.
   * Format: "Modifier+Key" (e.g., "Ctrl+Alt+I", "Cmd+Shift+K")
   * @default 'Ctrl+Alt+I'
   */
  manualTriggerKey: string;
}

/**
 * Default configuration with user-approved settings.
 * - Code: Auto-trigger with entire document context
 * - Prose: Manual trigger (Ctrl+Alt+I) with entire document context
 */
export const DEFAULT_CONFIG: InlineCompletionConfig = {
  code: {
    triggerMode: 'auto',
    contextBefore: -1, // Entire document
    contextAfter: -1, // Entire document
    language: 'python',
  },
  prose: {
    triggerMode: 'manual',
    contextBefore: -1, // Entire document
    contextAfter: -1, // Entire document
  },
  debounceMs: 200,
  manualTriggerKey: 'Ctrl+Alt+I', // Cross-platform: Cmd+Option+I on Mac, Ctrl+Alt+I elsewhere
};

/**
 * Partial configuration that can be provided by users.
 * All fields are optional and will be merged with defaults.
 */
export type PartialInlineCompletionConfig = {
  code?: Partial<ContentTypeConfig>;
  prose?: Partial<ContentTypeConfig>;
  debounceMs?: number;
  manualTriggerKey?: string;
};

/**
 * Merge user configuration with defaults.
 * Deep merges content type configs, shallow merges top-level options.
 *
 * @param userConfig - Partial user configuration
 * @returns Complete configuration with defaults filled in
 *
 * @example
 * ```typescript
 * const config = mergeConfig({
 *   prose: { triggerMode: 'auto' }
 * });
 * // Result: prose uses auto-trigger, everything else from defaults
 * ```
 */
export function mergeConfig(
  userConfig?: PartialInlineCompletionConfig,
): InlineCompletionConfig {
  if (!userConfig) {
    return { ...DEFAULT_CONFIG };
  }

  return {
    code: {
      ...DEFAULT_CONFIG.code,
      ...userConfig.code,
    },
    prose: {
      ...DEFAULT_CONFIG.prose,
      ...userConfig.prose,
    },
    debounceMs: userConfig.debounceMs ?? DEFAULT_CONFIG.debounceMs,
    manualTriggerKey:
      userConfig.manualTriggerKey ?? DEFAULT_CONFIG.manualTriggerKey,
  };
}

/**
 * Validate that a context scope value is valid.
 *
 * @param scope - Context scope value to validate
 * @returns True if valid (-1 or >= 0)
 */
export function isValidContextScope(scope: number): boolean {
  return scope === -1 || scope >= 0;
}

/**
 * Check if a content type should auto-trigger completions.
 *
 * @param config - Configuration for the content type
 * @returns True if auto-trigger is enabled
 */
export function shouldAutoTrigger(config: ContentTypeConfig): boolean {
  return config.triggerMode === 'auto';
}

/**
 * Check if a content type should respond to manual triggers.
 *
 * @param config - Configuration for the content type
 * @returns True if manual trigger is enabled
 */
export function shouldManualTrigger(config: ContentTypeConfig): boolean {
  return config.triggerMode === 'manual' || config.triggerMode === 'auto';
}

/**
 * Check if completions are disabled for a content type.
 *
 * @param config - Configuration for the content type
 * @returns True if completions are disabled
 */
export function isDisabled(config: ContentTypeConfig): boolean {
  return config.triggerMode === 'disabled';
}
