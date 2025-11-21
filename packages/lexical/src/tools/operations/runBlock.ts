/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Run block operation for Lexical documents
 *
 * @module tools/core/operations/runBlock
 */

import type {
  ToolOperation,
  LexicalExecutionContext,
} from '../core/interfaces';
import { formatResponse } from '../core/formatter';

/**
 * Parameters for running a block in a Lexical document
 */
export interface RunBlockParams {
  /**
   * ID of the block to run (from block_id field in readAllBlocks)
   * Block must be executable (e.g., jupyter-cell, code with executable: true)
   */
  id: string;
}

/**
 * Result of running a block
 */
export interface RunBlockResult {
  /** Whether the operation succeeded */
  success: boolean;

  /** The ID of the executed block */
  id?: string;

  /** Error message if operation failed */
  error?: string;
}

/**
 * Validates RunBlockParams at runtime.
 */
function isRunBlockParams(params: unknown): params is RunBlockParams {
  if (typeof params !== 'object' || params === null) {
    return false;
  }

  const p = params as Record<string, unknown>;

  // Validate required field
  if (typeof p.id !== 'string') {
    return false;
  }

  return true;
}

/**
 * Run block operation - executes a single block in a Lexical document
 *
 * Only works on executable blocks like jupyter-cell or code blocks with executable: true.
 * Triggers execution and returns immediately - use readBlock to check execution results.
 *
 * Uses lexicalId as the universal identifier (matches Lexical component).
 */
export const runBlockOperation: ToolOperation<RunBlockParams, RunBlockResult> =
  {
    name: 'runBlock',

    async execute(
      params: unknown,
      context: LexicalExecutionContext,
    ): Promise<RunBlockResult> {
      // Validate params using type guard
      if (!isRunBlockParams(params)) {
        throw new Error(
          `Invalid parameters for runBlock. Expected { id: string }. ` +
            `Received: ${JSON.stringify(params)}`,
        );
      }

      // Now TypeScript knows params is RunBlockParams!
      const { id } = params;
      const { lexicalId } = context;

      // Validate context
      if (!lexicalId) {
        throw new Error(
          'Lexical ID is required for runBlock operation. ' +
            'Ensure the tool execution context includes a valid lexicalId.',
        );
      }

      // Ensure executeCommand is available
      if (!context.executeCommand) {
        throw new Error(
          'executeCommand callback is required for runBlock operation.',
        );
      }

      try {
        // Call internal command with URI (VS Code-specific requirement)
        await context.executeCommand('lexical.runBlock', {
          lexicalId,
          blockId: id,
        });

        return formatResponse(
          {
            success: true,
            id: id,
          },
          context.format,
        ) as RunBlockResult;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to run block: ${errorMessage}`);
      }
    },
  };
