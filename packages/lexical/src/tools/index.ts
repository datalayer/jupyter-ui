/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
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
import { insertBlocksTool } from './definitions/insertBlocks';
import { updateBlockTool } from './definitions/updateBlock';
import { deleteBlockTool } from './definitions/deleteBlock';
import { readBlockTool } from './definitions/readBlock';
import { readAllBlocksTool } from './definitions/readAllBlocks';
import { runBlockTool } from './definitions/runBlock';
import { runAllBlocksTool } from './definitions/runAllBlocks';
import { listAvailableBlocksTool } from './definitions/listAvailableBlocks';

// Import all operations
import { insertBlockOperation } from './operations/insertBlock';
import { insertBlocksOperation } from './operations/insertBlocks';
import { updateBlockOperation } from './operations/updateBlock';
import { deleteBlockOperation } from './operations/deleteBlock';
import { readBlockOperation } from './operations/readBlock';
import { readAllBlocksOperation } from './operations/readAllBlocks';
import { runBlockOperation } from './operations/runBlock';
import { runAllBlocksOperation } from './operations/runAllBlocks';
import { listAvailableBlocksOperation } from './operations/listAvailableBlocks';

// Import types
import type { ToolDefinition } from './core/schema';
import type { ToolOperation } from '@datalayer/jupyter-react';

/**
 * Array of all lexical tool definitions
 */
export const lexicalToolDefinitions: ToolDefinition[] = [
  insertBlockTool,
  insertBlocksTool,
  updateBlockTool,
  deleteBlockTool,
  readBlockTool,
  readAllBlocksTool,
  runBlockTool,
  runAllBlocksTool,
  listAvailableBlocksTool,
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
  insertBlocks: insertBlocksOperation,
  updateBlock: updateBlockOperation,
  deleteBlock: deleteBlockOperation,
  readBlock: readBlockOperation,
  readAllBlocks: readAllBlocksOperation,
  runBlock: runBlockOperation,
  runAllBlocks: runAllBlocksOperation,
  listAvailableBlocks: listAvailableBlocksOperation,
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
export * from './operations/insertBlocks';
export * from './operations/updateBlock';
export * from './operations/deleteBlock';
export * from './operations/readBlock';
export * from './operations/readAllBlocks';
export * from './operations/runBlock';
export * from './operations/runAllBlocks';
export * from './operations/listAvailableBlocks';
export * from '../state';
export * from './utils';
