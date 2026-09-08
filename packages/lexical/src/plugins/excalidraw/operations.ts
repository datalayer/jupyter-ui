/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The agent-facing half of the Excalidraw tools.
 *
 * Each one validates its parameters and hands them to the executor; the work
 * happens in `handlers.ts`, in the browser, where the editor is. The split
 * matters here more than it does for the block tools, because everything an
 * Excalidraw tool touches — the converter, the scene, the node — is browser
 * code, and these operations run wherever the agent runs.
 *
 * So: nothing in this module may import Lexical or Excalidraw, directly or
 * transitively. That is what keeps the tool list loadable in Node.
 *
 * The eleven of them are the same three lines with different names, which is
 * why they are built rather than written out. Writing them out would be
 * eleven chances to get the validation call wrong, and nothing gained.
 *
 * @module plugins/excalidraw/operations
 */

import { validateWithZod } from '@datalayer/jupyter-react/tools';
import type { z } from 'zod';

import type { ToolOperation, ToolExecutionContext } from '../../tools/core/interfaces';
import type { ExcalidrawElementSummary } from './scene';
import {
  excalidrawAddElementsParamsSchema,
  excalidrawClearSceneParamsSchema,
  excalidrawConnectElementsParamsSchema,
  excalidrawDeleteElementsParamsSchema,
  excalidrawFromMermaidParamsSchema,
  excalidrawInsertNodeParamsSchema,
  excalidrawListDrawingsParamsSchema,
  excalidrawReadSceneParamsSchema,
  excalidrawResizeParamsSchema,
  excalidrawSetAppStateParamsSchema,
  excalidrawUpdateElementsParamsSchema,
} from './schemas';

/**
 * Build one operation.
 *
 * @param name - The operation name, which is also the handler's key and the
 *   `operation` field of the tool definition that points here.
 * @param schema - What the tool takes.
 */
function excalidrawOperation<TResult>(
  name: string,
  schema: z.ZodTypeAny,
): ToolOperation<unknown, TResult> {
  return {
    name,

    async execute(
      params: unknown,
      context: ToolExecutionContext,
    ): Promise<TResult> {
      const validated = validateWithZod(schema as any, params ?? {}, name);

      if (!context.documentId) {
        throw new Error(
          `Document ID is required for ${name}. ` +
            'Ensure the tool execution context includes a valid documentId.',
        );
      }
      if (!context.executor) {
        throw new Error(
          `Executor is required for ${name}. ` +
            'This should be provided by the platform (DefaultExecutor, BridgeExecutor, etc.)',
        );
      }

      try {
        return (await context.executor.execute(
          name,
          validated as Record<string, unknown>,
        )) as TResult;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to run ${name}: ${message}`);
      }
    },
  };
}

// ============================================================================
// Results
// ============================================================================

/** What a call that changed a drawing reports back. */
export interface ExcalidrawSceneResult {
  success: boolean;
  /** The drawing that was touched. */
  blockId: string;
  /** How many elements it holds afterwards. */
  elementCount: number;
  /** The ids of the elements the call created, in the order they were given. */
  createdIds?: string[];
  message?: string;
}

/** What inserting a drawing reports back. */
export interface ExcalidrawInsertNodeResult extends ExcalidrawSceneResult {
  /** The new block's id, for the calls that follow. */
  blockId: string;
}

/** One drawing in a listing. */
export interface ExcalidrawDrawingSummary {
  blockId: string;
  elementCount: number;
  /** "3 rectangles, 2 arrows: Start, Finish" */
  description: string;
  width?: number;
  height?: number;
}

/** What a listing reports back. */
export interface ExcalidrawListDrawingsResult {
  drawings: ExcalidrawDrawingSummary[];
  count: number;
}

/** What reading a drawing reports back. */
export interface ExcalidrawReadSceneResult {
  blockId: string;
  elementCount: number;
  elements: ExcalidrawElementSummary[] | Record<string, any>[];
  appState: Record<string, any>;
  description: string;
}

// ============================================================================
// The operations
// ============================================================================

export const excalidrawInsertNodeOperation =
  excalidrawOperation<ExcalidrawInsertNodeResult>(
    'excalidrawInsertNode',
    excalidrawInsertNodeParamsSchema,
  );

export const excalidrawListDrawingsOperation =
  excalidrawOperation<ExcalidrawListDrawingsResult>(
    'excalidrawListDrawings',
    excalidrawListDrawingsParamsSchema,
  );

export const excalidrawReadSceneOperation =
  excalidrawOperation<ExcalidrawReadSceneResult>(
    'excalidrawReadScene',
    excalidrawReadSceneParamsSchema,
  );

export const excalidrawAddElementsOperation =
  excalidrawOperation<ExcalidrawSceneResult>(
    'excalidrawAddElements',
    excalidrawAddElementsParamsSchema,
  );

export const excalidrawUpdateElementsOperation =
  excalidrawOperation<ExcalidrawSceneResult>(
    'excalidrawUpdateElements',
    excalidrawUpdateElementsParamsSchema,
  );

export const excalidrawDeleteElementsOperation =
  excalidrawOperation<ExcalidrawSceneResult>(
    'excalidrawDeleteElements',
    excalidrawDeleteElementsParamsSchema,
  );

export const excalidrawConnectElementsOperation =
  excalidrawOperation<ExcalidrawSceneResult>(
    'excalidrawConnectElements',
    excalidrawConnectElementsParamsSchema,
  );

export const excalidrawSetAppStateOperation =
  excalidrawOperation<ExcalidrawSceneResult>(
    'excalidrawSetAppState',
    excalidrawSetAppStateParamsSchema,
  );

export const excalidrawResizeOperation =
  excalidrawOperation<ExcalidrawSceneResult>(
    'excalidrawResize',
    excalidrawResizeParamsSchema,
  );

export const excalidrawClearSceneOperation =
  excalidrawOperation<ExcalidrawSceneResult>(
    'excalidrawClearScene',
    excalidrawClearSceneParamsSchema,
  );

export const excalidrawFromMermaidOperation =
  excalidrawOperation<ExcalidrawInsertNodeResult>(
    'excalidrawFromMermaid',
    excalidrawFromMermaidParamsSchema,
  );

/**
 * Every Excalidraw operation, keyed by the name its definition points at.
 */
export const excalidrawToolOperations: Record<
  string,
  ToolOperation<unknown, unknown>
> = {
  excalidrawInsertNode: excalidrawInsertNodeOperation,
  excalidrawListDrawings: excalidrawListDrawingsOperation,
  excalidrawReadScene: excalidrawReadSceneOperation,
  excalidrawAddElements: excalidrawAddElementsOperation,
  excalidrawUpdateElements: excalidrawUpdateElementsOperation,
  excalidrawDeleteElements: excalidrawDeleteElementsOperation,
  excalidrawConnectElements: excalidrawConnectElementsOperation,
  excalidrawSetAppState: excalidrawSetAppStateOperation,
  excalidrawResize: excalidrawResizeOperation,
  excalidrawClearScene: excalidrawClearSceneOperation,
  excalidrawFromMermaid: excalidrawFromMermaidOperation,
} as Record<string, ToolOperation<unknown, unknown>>;
