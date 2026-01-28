/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Tool executor interface and implementations.
 * Provides platform-agnostic execution abstraction.
 *
 * @module tools/core/executor
 */

import type { LexicalState } from '../../state/LexicalState';

/**
 * Tool executor interface - abstracts how operations are executed.
 * Platforms can implement this interface to provide custom execution logic.
 */
export interface ToolExecutor {
  /**
   * Execute a tool operation
   *
   * @param operationName - Name of the operation (e.g., "insertBlock", "runBlock")
   * @param args - Operation arguments
   * @returns Result from execution
   */
  execute(operationName: string, args: unknown): Promise<unknown>;
}

/**
 * Default executor - directly calls LexicalState store methods.
 * Uses 1:1 mapping between operation names and store methods with no transformation.
 *
 * @example
 * ```typescript
 * const executor = new DefaultExecutor(lexicalId, lexicalStore);
 * await executor.execute("insertBlock", { type: "paragraph", source: "Hello world" });
 * ```
 */
export class DefaultExecutor implements ToolExecutor {
  constructor(
    private lexicalId: string,
    private store: LexicalState,
  ) {}

  /**
   * Execute an operation by directly calling the corresponding LexicalState method.
   *
   * Operation names map 1:1 to LexicalState method names (e.g., "insertBlock" → store.insertBlock).
   * All args are passed directly to the store method with lexicalId injected.
   *
   * @param operationName - Name of the operation (e.g., "insertBlock", "runBlock")
   * @param args - Operation arguments (passed directly to store method)
   * @returns Result from store method
   */
  async execute<T = unknown>(
    operationName: string,
    args?: unknown,
  ): Promise<T> {
    // Get the store method directly (1:1 mapping, no transformation)
    const method = (this.store as unknown as Record<string, unknown>)[
      operationName
    ];

    if (typeof method !== 'function') {
      throw new Error(
        `Store method '${operationName}' not found or not a function`,
      );
    }

    // Inject lexicalId into args and call store method
    const payload =
      typeof args === 'object' && args !== null
        ? { id: this.lexicalId, ...args }
        : { id: this.lexicalId };

    try {
      const result = await (method as (args: unknown) => Promise<T>).call(
        this.store,
        payload,
      );

      return result;
    } catch (error) {
      console.error('[DefaultExecutor] Error calling store method:', error);
      throw error;
    }
  }
}
