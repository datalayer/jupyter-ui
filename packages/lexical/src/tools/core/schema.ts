/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Platform-agnostic tool configuration and definition schemas.
 *
 * @module tools/core/schema
 */

/**
 * Tool configuration interface.
 */
export interface ToolConfig<TParams = unknown> {
  /** Confirmation message from parameters */
  confirmationMessage?: (params: TParams) => string;

  /** Invocation message from parameters */
  invocationMessage?: (params: TParams) => string;

  /** Require user confirmation */
  requiresConfirmation?: boolean;

  /** Can be referenced in prompts */
  canBeReferencedInPrompt?: boolean;

  /** Priority for suggestion ranking */
  priority?: 'low' | 'medium' | 'high';

  /** Platform-specific config extensions */
  [key: string]: unknown;
}

/**
 * Tool definition interface.
 */
export interface ToolDefinition<TParams = unknown> {
  /** Vendor-prefixed tool name (e.g., "datalayer_insertCell") */
  name: string;

  /** Display name */
  displayName: string;

  /** User-facing reference name (e.g., "insertCell") */
  toolReferenceName: string;

  /** Tool description */
  description: string;

  /** JSON Schema for parameters */
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };

  /** Operation handler name */
  operation: string;

  /** Tool configuration */
  config?: ToolConfig<TParams>;

  /** Categorization tags */
  tags?: string[];
}
