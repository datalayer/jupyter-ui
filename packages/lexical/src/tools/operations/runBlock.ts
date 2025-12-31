/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Run block operation for Lexical documents
 *
 * @module tools/core/operations/runBlock
 */

import type { ToolOperation, ToolExecutionContext } from '../core/interfaces';
import { readAllBlocksOperation } from './readAllBlocks';
import { validateWithZod } from '@datalayer/jupyter-react';
import { runBlockParamsSchema, type RunBlockParams } from '../schemas/runBlock';

/**
 * Result from runBlock operation (snake_case for outputs, matching MCP and existing tools).
 */
export interface RunBlockResult {
  success: boolean;
  id?: string;
  execution_count?: number | null;
  outputs?: any[];
  elapsed_time?: number;
  message?: string;
  error?: string;
  timeout?: boolean;
}

/**
 * Run block operation - executes a single block in a Lexical document
 *
 * Only works on executable blocks like jupyter-cell or code blocks with executable: true.
 * Includes bounds validation, elapsed time tracking, and execution results with outputs.
 *
 * Uses documentId as the universal identifier (matches Lexical component).
 */
export const runBlockOperation: ToolOperation<RunBlockParams, RunBlockResult> =
  {
    name: 'runBlock',

    async execute(
      params: unknown,
      context: ToolExecutionContext,
    ): Promise<RunBlockResult> {
      // Validate params using Zod schema
      const {
        id,
        timeoutSeconds,
        stream = false,
        progressInterval = 5,
      } = validateWithZod(
        runBlockParamsSchema as any,
        params,
        this.name,
      ) as RunBlockParams;
      const { documentId } = context;

      if (!documentId) {
        return {
          success: false,
          error: 'Document ID is required for this operation.',
        };
      }

      // Ensure executor is available
      if (!context.executor) {
        throw new Error(
          'Executor is required for runBlock operation. ' +
            'This should be provided by the platform (DefaultExecutor, BridgeExecutor, etc.)',
        );
      }

      const startTime = Date.now();

      try {
        // Validate that block ID exists (bounds validation)
        const blocksResult = await readAllBlocksOperation.execute({}, context);

        if (!blocksResult.success || !blocksResult.blocks) {
          throw new Error('Failed to read blocks for bounds validation');
        }

        const blockExists = blocksResult.blocks.some(
          block => block.block_id === id,
        );

        if (!blockExists) {
          const blockCount = blocksResult.blocks.length;
          return {
            success: false,
            error: `Block ID '${id}' not found. The document has ${blockCount} block${blockCount !== 1 ? 's' : ''}.`,
          };
        }

        // Call executor and capture results
        let executorResult: any;

        if (timeoutSeconds !== undefined) {
          // Create timeout promise
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(
                new Error(
                  `TIMEOUT_ERROR: Block execution exceeded ${timeoutSeconds} seconds`,
                ),
              );
            }, timeoutSeconds * 1000);
          });

          // Create execution promise
          const executionPromise = context.executor!.execute(this.name, {
            blockId: id,
            timeoutSeconds,
            stream,
            progressInterval,
          });

          // Race between execution and timeout
          executorResult = await Promise.race([
            executionPromise,
            timeoutPromise,
          ]);
        } else {
          // No timeout - execute normally
          executorResult = await context.executor!.execute(this.name, {
            blockId: id,
            stream,
            progressInterval,
          });
        }

        // Calculate elapsed time
        const elapsed_time = (Date.now() - startTime) / 1000;

        // Extract outputs from executor result
        const execution_count = executorResult?.execution_count ?? null;
        const outputs = executorResult?.outputs ?? [];

        // Use the message from executor result, or create a default one
        const message =
          executorResult?.message ||
          `Block executed in ${elapsed_time.toFixed(2)}s`;

        return {
          success: true,
          id,
          execution_count,
          outputs,
          elapsed_time,
          message,
        };
      } catch (error) {
        const elapsed_time = (Date.now() - startTime) / 1000;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        // Check if this is a timeout error
        if (errorMessage.includes('TIMEOUT_ERROR')) {
          return {
            success: false,
            timeout: true,
            id,
            elapsed_time,
            error: `Execution timed out after ${timeoutSeconds} seconds`,
          };
        }

        // Regular error (not timeout)
        throw new Error(`Failed to run block: ${errorMessage}`);
      }
    },
  };
