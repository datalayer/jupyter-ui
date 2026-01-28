/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Platform-agnostic notebook tools.
 *
 * @module tools
 */

// Import all tool definitions
import { insertCellTool } from './definitions/insertCell';
import { deleteCellsTool } from './definitions/deleteCells';
import { updateCellTool } from './definitions/updateCell';
import { readCellTool } from './definitions/readCell';
import { readAllCellsTool } from './definitions/readAllCells';
import { runCellTool } from './definitions/runCell';
import { executeCodeTool } from './definitions/executeCode';

// Import all operations
import { insertCellOperation } from './operations/insertCell';
import { deleteCellsOperation } from './operations/deleteCells';
import { updateCellOperation } from './operations/updateCell';
import { readCellOperation } from './operations/readCell';
import { readAllCellsOperation } from './operations/readAllCells';
import { runCellOperation } from './operations/runCell';
import { executeCodeOperation } from './operations/executeCode';

// Import types
import type { ToolDefinition } from './core/schema';
import type { ToolOperation } from './core/interfaces';

/**
 * Array of all notebook tool definitions
 */
export const notebookToolDefinitions: ToolDefinition[] = [
  insertCellTool,
  deleteCellsTool,
  updateCellTool,
  readCellTool,
  readAllCellsTool,
  runCellTool,
  executeCodeTool,
];

/**
 * Registry of all notebook tool operations
 * Maps operation names to their implementations
 */
export const notebookToolOperations: Record<
  string,
  ToolOperation<unknown, unknown>
> = {
  insertCell: insertCellOperation,
  deleteCells: deleteCellsOperation,
  updateCell: updateCellOperation,
  readCell: readCellOperation,
  readAllCells: readAllCellsOperation,
  runCell: runCellOperation,
  executeCode: executeCodeOperation,
};

/**
 * Complete notebook tools bundle for easy iteration and registration
 */
export const notebookTools = {
  definitions: notebookToolDefinitions,
  operations: notebookToolOperations,
};

// Re-export everything for convenience
export * from './core';
export * from './definitions';
