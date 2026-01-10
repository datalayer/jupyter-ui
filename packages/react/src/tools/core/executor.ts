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

import type { NotebookState } from '../../components/notebook/NotebookState';

/**
 * Tool executor interface - abstracts how operations are executed.
 * Platforms can implement this interface to provide custom execution logic.
 */
export interface ToolExecutor {
  /**
   * Execute a tool operation
   *
   * @param operationName - Name of the operation (e.g., "insertCell", "runCell")
   * @param args - Operation arguments
   * @returns Result from execution
   */
  execute(operationName: string, args: unknown): Promise<unknown>;
}

/**
 * Default executor - directly calls NotebookState store methods.
 * Calls methods with individual parameters by spreading the payload object.
 *
 * @example
 * ```typescript
 * const executor = new DefaultExecutor(documentId, notebookStore);
 * await executor.execute("insertCell", { type: "code", index: 0, source: "print('hi')" });
 * // Calls: store.insertCell(documentId, "code", 0, "print('hi')")
 * ```
 */
export class DefaultExecutor implements ToolExecutor {
  constructor(
    private documentId: string,
    private store: NotebookState
  ) {}

  /**
   * Execute an operation by calling the corresponding NotebookState method.
   * Builds payload with documentId and spreads values as individual parameters.
   *
   * @param operationName - Name of the operation (e.g., "insertCell", "deleteCell")
   * @param args - Operation arguments as an object
   * @returns Result from store method
   */
  async execute(operationName: string, args: unknown): Promise<unknown> {
    // Get the store method directly (1:1 mapping, no transformation)
    const method = (this.store as unknown as Record<string, unknown>)[
      operationName
    ];

    if (typeof method !== 'function') {
      throw new Error(
        `Store method '${operationName}' not found or not a function`
      );
    }

    // Build payload: { id, ...args } - pass as single object parameter
    const payload =
      typeof args === 'object' && args !== null
        ? { id: this.documentId, ...args }
        : { id: this.documentId };

    // Call method with payload object as first parameter
    // Methods will check if first param is object and destructure accordingly
    const methodFn = method as (payload: unknown) => unknown;
    const result = await methodFn.call(this.store, payload);

    return result;
  }
}
