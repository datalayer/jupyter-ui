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

// NOTE: This executor is designed for notebooks, not lexical documents
// Commenting out for now as this import doesn't exist in lexical package
// import type { Notebook2State } from '../../components/notebook/Notebook2State';

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
 * Default executor - directly calls Notebook2State store methods.
 * Uses 1:1 mapping between operation names and store methods with no transformation.
 *
 * NOTE: This class is designed for notebooks, not lexical documents.
 * It's kept here for reference but may need adaptation for lexical use.
 *
 * @example
 * ```typescript
 * const executor = new DefaultExecutor(notebookId, notebookStore);
 * await executor.execute("insertCell", { type: "code", source: "print('hi')" });
 * ```
 */
export class DefaultExecutor implements ToolExecutor {
  constructor(
    private notebookId: string,
    private store: any, // Notebook2State - commented out as it doesn't exist in lexical package
  ) {}

  /**
   * Execute an operation by directly calling the corresponding Notebook2State method.
   *
   * Operation names map 1:1 to Notebook2State method names (e.g., "insertCell" → store.insertCell).
   * All args are passed directly to the store method with notebookId injected.
   *
   * @param operationName - Name of the operation (e.g., "insertCell", "runCell")
   * @param args - Operation arguments (passed directly to store method)
   * @returns Result from store method
   */
  async execute(operationName: string, args: unknown): Promise<unknown> {
    // Get the store method directly (1:1 mapping, no transformation)
    const method = (this.store as unknown as Record<string, unknown>)[
      operationName
    ];

    if (typeof method !== 'function') {
      throw new Error(
        `Store method '${operationName}' not found or not a function`,
      );
    }

    // Inject notebookId into args and call store method
    const payload =
      typeof args === 'object' && args !== null
        ? { id: this.notebookId, ...args }
        : { id: this.notebookId };

    return await (method as (args: unknown) => Promise<unknown>).call(
      this.store,
      payload,
    );
  }
}
