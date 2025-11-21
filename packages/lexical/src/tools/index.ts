/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Lexical Tools - Main Export
 *
 * Centralized export of all tool definitions and operations for easy registration.
 *
 * @module jupyter-ui-lexical/tools
 */

// Import all tool definitions
import { insertBlockTool } from './definitions/insertBlock';
import { updateBlockTool } from './definitions/updateBlock';
import { deleteBlockTool } from './definitions/deleteBlock';
import { readBlockTool } from './definitions/readBlock';
import { readAllBlocksTool } from './definitions/readAllBlocks';
import { runBlockTool } from './definitions/runBlock';
import { runAllBlocksTool } from './definitions/runAllBlocks';
import { listAvailableBlocksTool } from './definitions/listAvailableBlocks';
import { executeCodeTool } from './definitions/executeCode';

// Import all operations
import { insertBlockOperation } from './operations/insertBlock';
import { updateBlockOperation } from './operations/updateBlock';
import { deleteBlockOperation } from './operations/deleteBlock';
import { readBlockOperation } from './operations/readBlock';
import { readAllBlocksOperation } from './operations/readAllBlocks';
import { runBlockOperation } from './operations/runBlock';
import { runAllBlocksOperation } from './operations/runAllBlocks';
import { listAvailableBlocksOperation } from './operations/listAvailableBlocks';
import { executeCodeOperation } from './operations/executeCode';

// Import types
import type { ToolDefinition } from './core';
import type { ToolOperation } from './core/interfaces';

/**
 * Array of all lexical tool definitions
 */
export const lexicalToolDefinitions: ToolDefinition[] = [
  insertBlockTool,
  updateBlockTool,
  deleteBlockTool,
  readBlockTool,
  readAllBlocksTool,
  runBlockTool,
  runAllBlocksTool,
  listAvailableBlocksTool,
  executeCodeTool,
];

/**
 * Registry of all lexical tool operations
 * Maps operation names to their implementations
 */
export const lexicalToolOperations: Record<
  string,
  ToolOperation<unknown, unknown>
> = {
  insertBlock: insertBlockOperation,
  updateBlock: updateBlockOperation,
  deleteBlock: deleteBlockOperation,
  readBlock: readBlockOperation,
  readAllBlocks: readAllBlocksOperation,
  runBlock: runBlockOperation,
  runAllBlocks: runAllBlocksOperation,
  listAvailableBlocks: listAvailableBlocksOperation,
  executeCode: executeCodeOperation,
};

/**
 * Complete lexical tools bundle for easy iteration and registration
 */
export const lexicalTools = {
  definitions: lexicalToolDefinitions,
  operations: lexicalToolOperations,
};

// Re-export everything for convenience
export * from './core';
export * from './definitions';
export * from './operations/insertBlock';
export * from './operations/updateBlock';
export * from './operations/deleteBlock';
export * from './operations/readBlock';
export * from './operations/readAllBlocks';
export * from './operations/runBlock';
export * from './operations/runAllBlocks';
export * from './operations/listAvailableBlocks';
export * from './operations/executeCode';
export * from '../state';
export * from './utils';
