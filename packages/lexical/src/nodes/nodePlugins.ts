/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

import { Klass, LexicalNode } from 'lexical';

/**
 * Registry for plugin-contributed nodes
 * Plugins can register their nodes at runtime
 */
class NodePluginRegistry {
  private plugins: Map<string, Array<Klass<LexicalNode>>> = new Map();

  registerPlugin(pluginName: string, nodes: Array<Klass<LexicalNode>>) {
    this.plugins.set(pluginName, nodes);
  }

  unregisterPlugin(pluginName: string) {
    this.plugins.delete(pluginName);
  }

  getAllPluginNodes(): Array<Klass<LexicalNode>> {
    const allNodes: Array<Klass<LexicalNode>> = [];
    this.plugins.forEach(nodes => allNodes.push(...nodes));
    return allNodes;
  }
}

export const nodePluginRegistry = new NodePluginRegistry();

/**
 * Helper to create a node plugin
 */
export function createNodePlugin(
  name: string,
  nodes: Array<Klass<LexicalNode>>,
) {
  return {
    install: () => nodePluginRegistry.registerPlugin(name, nodes),
    uninstall: () => nodePluginRegistry.unregisterPlugin(name),
  };
}
