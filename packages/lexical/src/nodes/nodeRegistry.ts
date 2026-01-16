/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

import { Klass, LexicalNode } from 'lexical';
import * as allNodes from './index';

/**
 * Automatically collects all node classes exported from ./index.ts
 * No manual registration needed!
 */
export function getAllNodes(): Array<Klass<LexicalNode>> {
  const nodes: Array<Klass<LexicalNode>> = [];

  // Iterate through all exports
  Object.values(allNodes).forEach(exportValue => {
    // Check if it's a Lexical node class (has getType static method)
    if (
      typeof exportValue === 'function' &&
      typeof (exportValue as any).getType === 'function' &&
      typeof (exportValue as any).clone === 'function'
    ) {
      nodes.push(exportValue as Klass<LexicalNode>);
    }
  });

  return nodes;
}

/**
 * Get nodes by category (optional filtering)
 */
export function getNodesByCategory(
  category: 'jupyter' | 'media' | 'all' = 'all',
): Array<Klass<LexicalNode>> {
  const allNodesArray = getAllNodes();

  if (category === 'all') return allNodesArray;

  return allNodesArray.filter(nodeClass => {
    const type = (nodeClass as any).getType();

    if (category === 'jupyter') {
      return type.startsWith('jupyter-');
    }
    if (category === 'media') {
      return ['image', 'youtube', 'excalidraw', 'equation'].includes(type);
    }

    return false;
  });
}
