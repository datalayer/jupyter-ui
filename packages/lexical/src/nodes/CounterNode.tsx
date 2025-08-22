/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import {
  DecoratorNode,
  type EditorConfig,
  type LexicalEditor,
  type NodeKey,
  $setState,
} from 'lexical';
import { CounterComponent } from './CounterComponent';
import { counterValueState } from './counterState';

// NodeState imported from separate module to keep React Fast Refresh happy

export type SerializedCounterNode = {
  type: 'counter';
  version: 1;
  count: number;
};

export class CounterNode extends DecoratorNode<JSX.Element> {
  __count: number;

  static getType(): string {
    return 'counter';
  }

  static clone(node: CounterNode): CounterNode {
    return new CounterNode(node.__count, node.__key);
  }

  static importJSON(json: SerializedCounterNode): CounterNode {
    const node = new CounterNode(json.count);
    // Also hydrate NodeState for consistency
    try {
      $setState(node, counterValueState, json.count);
    } catch {
      /* no-op */
    }
    return node;
  }

  exportJSON(): SerializedCounterNode {
    return {
      type: 'counter',
      version: 1,
      count: this.__count,
    };
  }

  constructor(count = 0, key?: NodeKey) {
    super(key);
    this.__count = count;
  }

  // Block-level
  isInline(): boolean {
    return false;
  }

  createDOM(_config: EditorConfig, _editor: LexicalEditor): HTMLElement {
    const elem = document.createElement('div');
    elem.className = 'counter-node';
    elem.style.display = 'block';
    elem.style.padding = '8px';
    elem.style.margin = '8px 0';
    elem.style.border = '1px solid #ddd';
    elem.style.borderRadius = '6px';
    elem.style.background = '#fafafa';
    return elem;
  }

  updateDOM(): boolean {
    return false; // Controlled by React in decorate()
  }

  getCount(): number {
    return this.__count;
  }

  setCount(count: number): void {
    const writable = this.getWritable();
    writable.__count = count;
  }

  decorate(editor: LexicalEditor): JSX.Element {
    return <CounterComponent editor={editor} nodeKey={this.getKey()} />;
  }
}

export function $createCounterNode(initial = 0): CounterNode {
  return new CounterNode(initial);
}

export function $isCounterNode(node: unknown): node is CounterNode {
  return node instanceof CounterNode;
}

// React component now lives in CounterComponent.tsx
