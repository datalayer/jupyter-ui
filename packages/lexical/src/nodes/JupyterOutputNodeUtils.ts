/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { INPUT_UUID_TO_CODE_KEY } from '../plugins/JupyterInputOutputPlugin';
import type { JupyterOutputNode } from './JupyterOutputNode';

/**
 * Check if a JupyterOutputNode is orphaned (its parent input node was deleted).
 *
 * An output node is considered orphaned if:
 * 1. Its parent input node UUID is not in the INPUT_UUID_TO_CODE_KEY map, OR
 * 2. The output node has no parent in the Lexical tree
 *
 * @param outputNode - The JupyterOutputNode to check
 * @returns true if the output node is orphaned, false otherwise
 */
export function isJupyterOutputNodeOrphaned(
  outputNode: JupyterOutputNode,
): boolean {
  const inputNodeKey = INPUT_UUID_TO_CODE_KEY.get(
    outputNode.getJupyterInputNodeUuid(),
  );
  return !inputNodeKey || !outputNode.getParent();
}
