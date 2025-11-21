/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Core interfaces for platform-agnostic tool operations.
 * These interfaces enable the 3-tier architecture by abstracting
 * document access and tool execution from specific platforms.
 *
 * @module tools/core/interfaces
 */

import type {
  CellData,
  NotebookMetadata,
  ExecutionResult,
  RuntimeInfo,
} from './types';

// Re-export types for platform adapters
export type { CellData, NotebookMetadata, ExecutionResult, RuntimeInfo };

// Import Lexical types
import type {
  LexicalBlock,
  LexicalMetadata,
  RegisteredNodeInfo,
} from './types';
export type { LexicalBlock, LexicalMetadata, RegisteredNodeInfo };

/**
 * Base document handle - common operations for all document types.
 */
export interface DocumentHandle {
  /**
   * Get document metadata
   */
  getMetadata(): Promise<NotebookMetadata | LexicalMetadata>;

  /**
   * Save the document (optional)
   */
  save?(): Promise<void>;

  /**
   * Close the document (optional)
   */
  close?(): Promise<void>;
}

/**
 * Notebook document handle - for Jupyter notebooks.
 *
 * Platform implementations:
 * - VS Code: VSCodeDocumentHandle (webview messages)
 * - SaaS: SaaSDocumentHandle (JupyterLab APIs)
 */
export interface NotebookHandle extends DocumentHandle {
  /**
   * Get notebook metadata (narrowed type)
   */
  getMetadata(): Promise<NotebookMetadata>;

  /**
   * Get total number of cells in the notebook
   */
  getCellCount(): Promise<number>;

  /**
   * Get a specific cell by index
   */
  getCell(index: number): Promise<CellData>;

  /**
   * Get all cells from the notebook
   */
  getAllCells(): Promise<CellData[]>;

  /**
   * Insert a cell at the specified index
   */
  insertCell(index: number, cell: CellData): Promise<void>;

  /**
   * Delete a cell at the specified index
   */
  deleteCell(index: number): Promise<void>;

  /**
   * Update a cell's source code
   */
  updateCell(index: number, source: string): Promise<void>;

  /**
   * Execute a code cell
   */
  executeCell(index: number): Promise<ExecutionResult>;
}

/**
 * Lexical document handle - for Lexical rich text documents.
 *
 * Platform implementations:
 * - VS Code: VSCodeLexicalHandle (webview messages)
 * - SaaS: SaaSLexicalHandle (direct DOM)
 */
export interface LexicalHandle extends DocumentHandle {
  /**
   * Get Lexical metadata (narrowed type)
   */
  getMetadata(): Promise<LexicalMetadata>;

  /**
   * Get all blocks with their block_id values
   */
  getBlocks(): Promise<LexicalBlock[]>;

  /**
   * Insert a block after a specific block ID
   * @param block - Block to insert (block_id will be generated)
   * @param afterBlockId - Block ID to insert after ('TOP', 'BOTTOM', or actual block_id)
   */
  insertBlock(block: LexicalBlock, afterBlockId: string): Promise<void>;

  /**
   * Insert multiple blocks sequentially
   * @param blocks - Array of blocks to insert
   * @param afterBlockId - Block ID to insert first block after ('TOP', 'BOTTOM', or actual block_id)
   */
  insertBlocks(blocks: LexicalBlock[], afterBlockId: string): Promise<void>;

  /**
   * Delete a block by its ID
   * @param blockId - ID of the block to delete
   */
  deleteBlock(blockId: string): Promise<void>;

  /**
   * Update a block by its ID
   * @param blockId - ID of the block to update
   * @param block - New block data
   */
  updateBlock(blockId: string, block: LexicalBlock): Promise<void>;

  /**
   * Get registered node types from editor
   */
  getAvailableBlockTypes(): Promise<RegisteredNodeInfo[]>;
}

/**
 * Type guard for NotebookHandle
 */
export function isNotebookHandle(
  handle: DocumentHandle | undefined,
): handle is NotebookHandle {
  return handle !== undefined && 'getCellCount' in handle;
}

/**
 * Type guard for LexicalHandle
 */
export function isLexicalHandle(
  handle: DocumentHandle | undefined,
): handle is LexicalHandle {
  return handle !== undefined && 'getBlocks' in handle;
}

/**
 * Base tool execution context - common to all operations
 */
export interface BaseExecutionContext {
  /**
   * Datalayer SDK for API operations
   * (Required for notebook/runtime creation tools)
   */
  sdk?: unknown; // DatalayerClient (avoid circular import)

  /**
   * Authentication provider
   * (Required for authenticated operations)
   */
  auth?: unknown; // AuthProvider (avoid circular import)

  /**
   * Response format for tool results
   * - "json": Standard JSON format (default) - structured data
   * - "toon": TOON format - human/LLM-readable with compact syntax
   */
  format?: 'json' | 'toon';

  /**
   * Platform-agnostic command execution callback.
   * Allows operations to invoke platform-specific commands without direct dependencies.
   *
   * Operations call this with namespaced command names (e.g., "notebook.insertCell", "lexical.insertBlock").
   * The platform adapter is responsible for mapping these to the appropriate implementation.
   *
   * @param command - Command name with namespace prefix (e.g., "notebook.insertCell")
   * @param args - Command arguments (platform adapter handles any necessary conversions)
   * @returns Command result
   */
  executeCommand?: <T = void>(command: string, args: unknown) => Promise<T>;

  /**
   * Platform-specific extras (escape hatch for special cases)
   * Use this to pass additional context that doesn't fit in the standard interface.
   */
  extras?: Record<string, unknown>;
}

/**
 * Notebook-specific execution context
 * Used by all notebook cell operations (insert, delete, update, execute, read)
 */
export interface NotebookExecutionContext extends BaseExecutionContext {
  /**
   * Notebook ID - universal identifier for both local and remote notebooks
   * - Local notebooks: Same as file URI (e.g., "file:///path/to/notebook.ipynb")
   * - Remote notebooks: Datalayer document UID (e.g., "01KAJ42KE2XKM7NBNZV568KXQX")
   *
   * This is the same ID used by Notebook2 component: `id={documentId || notebookId}`
   */
  notebookId: string;
}

/**
 * Lexical-specific execution context
 * Used by all Lexical block operations (insertBlock, deleteBlock, readBlocks)
 */
export interface LexicalExecutionContext extends BaseExecutionContext {
  /**
   * Lexical document ID - universal identifier for both local and remote documents
   * - Local documents: Same as file URI (e.g., "file:///path/to/document.lexical")
   * - Remote documents: Datalayer document UID (e.g., "01KAJ42KE2XKM7NBNZV568KXQX")
   */
  lexicalId: string;
}

/**
 * Generic execution context (for operations that don't need documents)
 * Used by creation tools (createNotebook, startRuntime, etc.)
 */
export interface ToolExecutionContext extends BaseExecutionContext {
  /**
   * Optional notebook ID (for notebook-specific operations)
   * - Local notebooks: Same as file URI (e.g., "file:///path/to/notebook.ipynb")
   * - Remote notebooks: Datalayer document UID (e.g., "01KAJ42KE2XKM7NBNZV568KXQX")
   */
  notebookId?: string;

  /**
   * Optional lexical document ID (for lexical-specific operations)
   * - Local documents: Same as file URI (e.g., "file:///path/to/document.lexical")
   * - Remote documents: Datalayer document UID (e.g., "01KAJ42KE2XKM7NBNZV568KXQX")
   */
  lexicalId?: string;

  /**
   * Optional generic document ID (backwards compatibility)
   * - For notebooks: Same as notebookId
   * - For Lexical: Same as lexicalId
   */
  documentId?: string;
}

/**
 * Core tool operation interface - platform agnostic.
 *
 * All tool operations implement this interface, enabling them to work
 * identically across VS Code, SaaS, and ag-ui platforms.
 *
 * @template TParams - Tool parameter type (input)
 * @template TResult - Tool result type (output)
 */
export interface ToolOperation<TParams, TResult> {
  /**
   * Unique operation name (used for registry lookup)
   * Must match the `operation` field in ToolDefinition that references this operation.
   */
  name: string;

  /**
   * Execute the operation with given parameters and context
   *
   * Note: Description, parameters schema, and other metadata are defined in the
   * ToolDefinition (schema), not here. Operations are pure implementation.
   *
   * @param params - Tool-specific parameters
   * @param context - Execution context (document, SDK, auth)
   * @returns Operation result
   * @throws Error if operation fails
   */
  execute(params: TParams, context: ToolExecutionContext): Promise<TResult>;
}

/**
 * Tool operation registry interface
 *
 * Provides centralized access to all available operations.
 */
export interface ToolOperationRegistry {
  /**
   * Register a tool operation
   */
  register<TParams, TResult>(operation: ToolOperation<TParams, TResult>): void;

  /**
   * Get a tool operation by name
   */
  get<TParams, TResult>(
    name: string,
  ): ToolOperation<TParams, TResult> | undefined;

  /**
   * Check if an operation is registered
   */
  has(name: string): boolean;

  /**
   * Get all registered operation names
   */
  getAllNames(): string[];

  /**
   * Get all registered operations
   */
  getAll(): Array<ToolOperation<unknown, unknown>>;
}
