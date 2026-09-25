/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { $jupyterInputNodeFor } from '../plugins/JupyterInputOutputPlugin';
import type { JupyterOutputNode } from './JupyterOutputNode';

/**
 * Check if a JupyterOutputNode is orphaned (its parent input node was deleted).
 *
 * An output node is considered orphaned if:
 * 1. No input node with its input uuid exists in this editor, OR
 * 2. The output node has no parent in the Lexical tree
 *
 * @param outputNode - The JupyterOutputNode to check
 * @returns true if the output node is orphaned, false otherwise
 */
export function isJupyterOutputNodeOrphaned(
  outputNode: JupyterOutputNode,
): boolean {
  // By uuid, in this editor: a key in the registry may be another editor's.
  const inputNode = $jupyterInputNodeFor(outputNode.getJupyterInputNodeUuid());
  return inputNode === null || !outputNode.getParent();
}
