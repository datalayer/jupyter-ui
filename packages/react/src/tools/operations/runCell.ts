/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Platform-agnostic cell execution operation.
 *
 * @module tools/operations/runCell
 */

import type { ToolOperation, ToolExecutionContext } from '../core/interfaces';
import { readAllCellsOperation } from './readAllCells';
import { validateWithZod } from '../core/zodUtils';
import { runCellParamsSchema, type RunCellParams } from '../schemas/runCell';

/**
 * Result from runCell operation (snake_case for outputs, matching MCP and existing tools).
 */
export interface RunCellResult {
  success: boolean;
  index?: number;
  execution_count?: number | null;
  outputs?: Array<string>;
  elapsed_time?: number;
  message?: string;
  error?: string;
  timeout?: boolean;
}

/**
 * Executes a cell and displays its output.
 */

export const runCellOperation: ToolOperation<RunCellParams, RunCellResult> = {
  name: 'runCell',

  async execute(
    params: unknown,
    context: ToolExecutionContext
  ): Promise<RunCellResult> {
    // Validate params using Zod schema
    const {
      index,
      timeoutSeconds,
      stream = false,
      progressInterval = 5,
    } = validateWithZod(runCellParamsSchema, params, this.name);
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
        'Executor is required for runCell operation. ' +
          'This should be provided by the platform (DefaultExecutor, BridgeExecutor, etc.)'
      );
    }

    const startTime = Date.now();

    try {
      // If index is provided, validate that it's within bounds
      if (index !== undefined) {
        const cellsResult = await readAllCellsOperation.execute({}, context);

        if (!cellsResult.success || !cellsResult.cells) {
          throw new Error('Failed to read cells for bounds validation');
        }

        const cellCount = cellsResult.cellCount || cellsResult.cells.length;

        // Validate index bounds
        if (index < 0 || index >= cellCount) {
          return {
            success: false,
            error: `Index ${index} is out of bounds. The notebook has ${cellCount} cell${cellCount !== 1 ? 's' : ''} (valid indices: 0-${cellCount - 1}).`,
          };
        }
      }

      // Call executor with timeout and streaming parameters
      const executionPromise = context.executor.execute(this.name, {
        index,
        timeoutSeconds,
        stream,
        progressInterval,
      });

      // Only enforce timeout if explicitly provided
      let result;
      if (timeoutSeconds !== undefined) {
        // Wrap execution with timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(
              new Error(
                `TIMEOUT_ERROR: Cell execution exceeded ${timeoutSeconds} seconds`
              )
            );
          }, timeoutSeconds * 1000);
        });

        // Race between execution and timeout
        result = await Promise.race([executionPromise, timeoutPromise]);
      } else {
        // No timeout - wait indefinitely (normal Jupyter behavior)
        result = await executionPromise;
      }

      // Calculate elapsed time
      const elapsed_time = (Date.now() - startTime) / 1000;

      // Extract outputs from result
      const executionResult = result as {
        execution_count?: number | null;
        outputs?: Array<string>;
      };

      const message =
        index !== undefined
          ? `Cell at index ${index} executed in ${elapsed_time.toFixed(2)}s`
          : `Active cell executed in ${elapsed_time.toFixed(2)}s`;

      return {
        success: true,
        index,
        execution_count: executionResult.execution_count ?? null,
        outputs: executionResult.outputs ?? [],
        elapsed_time,
        message,
      };
    } catch (error) {
      const elapsed_time = (Date.now() - startTime) / 1000;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Check if this is a timeout error
      if (errorMessage.includes('TIMEOUT_ERROR')) {
        // Try to get partial outputs
        let partialOutputs: Array<string> = [];
        try {
          const cellData = await context.executor.execute('readCell', {
            index,
            includeOutputs: true,
          });
          if (
            cellData &&
            typeof cellData === 'object' &&
            'outputs' in cellData
          ) {
            partialOutputs =
              (cellData as { outputs?: Array<string> }).outputs ?? [];
          }
        } catch {
          // Ignore errors reading partial outputs
        }

        return {
          success: false,
          timeout: true,
          index,
          outputs: [
            `[TIMEOUT ERROR: Cell execution exceeded ${timeoutSeconds} seconds. Partial outputs may be available.]`,
            ...partialOutputs,
          ],
          elapsed_time,
          error: `Execution timed out after ${timeoutSeconds} seconds`,
        };
      }

      // Regular error (not timeout)
      throw new Error(`Failed to run cell: ${errorMessage}`);
    }
  },
};
