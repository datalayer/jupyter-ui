/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The Excalidraw tools, as one thing the plugin can hand over.
 *
 * Definitions, operations and handlers travel together because they are three
 * views of the same eleven tools, and a set that has drifted — a definition
 * pointing at an operation nobody wrote, a handler nobody advertises — is a
 * tool that fails at call time rather than at build time. Keeping them
 * adjacent is what the check below is able to exploit.
 *
 * @module plugins/excalidraw/tools
 */

import type { LexicalPluginTools } from '../../tools/core/pluginTools';
import { excalidrawToolDefinitions } from './definitions';
import { excalidrawToolHandlers } from './handlers';
import { excalidrawToolOperations } from './operations';

/**
 * Everything the plugin contributes while it is mounted.
 */
export const excalidrawPluginTools: LexicalPluginTools = {
  name: 'excalidraw',
  definitions: excalidrawToolDefinitions,
  operations: excalidrawToolOperations,
  handlers: excalidrawToolHandlers,
};

/**
 * The operation names the three halves disagree about, if any.
 *
 * A definition without an operation is a tool the model can call and nothing
 * answers; an operation without a handler is a call that reaches the executor
 * and finds nothing to run. Neither shows up until an agent tries it, which
 * is far too late — so this is checked in the tests, where it is cheap.
 */
export function excalidrawToolMismatches(): string[] {
  const problems: string[] = [];
  for (const definition of excalidrawToolDefinitions) {
    if (!excalidrawToolOperations[definition.operation]) {
      problems.push(
        `${definition.name} points at operation '${definition.operation}', which does not exist`,
      );
    }
    if (!definition.toolReferenceName.startsWith('excalidraw')) {
      problems.push(
        `${definition.name} is not named for the plugin it belongs to`,
      );
    }
  }
  for (const name of Object.keys(excalidrawToolOperations)) {
    if (!excalidrawToolHandlers[name]) {
      problems.push(`operation '${name}' has no handler`);
    }
  }
  for (const name of Object.keys(excalidrawToolHandlers)) {
    if (!excalidrawToolOperations[name]) {
      problems.push(`handler '${name}' has no operation`);
    }
  }
  return problems;
}
