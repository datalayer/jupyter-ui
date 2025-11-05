/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Lexical DecoratorNode for rendering LLM-powered inline completion ghost text.
 * Uses NodeTransform to persist across JupyterInputNode updates from syntax highlighting.
 *
 * @module nodes/InlineCompletionNode
 *
 * @remarks
 * This node is managed by LexicalInlineCompletionPlugin which:
 * - Inserts the node when completions are received
 * - Re-adds it via NodeTransform when JupyterInputOutputPlugin recreates the tree
 * - Removes it when Tab (accept) or Escape (dismiss) is pressed
 *
 * @example
 * ```typescript
 * const completionNode = $createInlineCompletionNode('suggested code');
 * jupyterInputNode.append(completionNode);
 * ```
 */

import type {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';

import { DecoratorNode } from 'lexical';
import * as React from 'react';

/**
 * Props for InlineCompletionComponent
 */
export interface InlineCompletionNodeProps {
  /** The completion text to display as ghost text */
  completionText: string;
}

/**
 * Serialized representation of InlineCompletionNode
 */
export type SerializedInlineCompletionNode = Spread<
  {
    completionText: string;
  },
  SerializedLexicalNode
>;

/**
 * Lexical DecoratorNode that renders inline completion ghost text.
 * Styled with low opacity and VS Code theme colors to appear as suggestions.
 */
export class InlineCompletionNode extends DecoratorNode<React.ReactElement> {
  __completionText: string;

  /**
   * Returns the node type identifier.
   * @returns Node type string
   */
  static getType(): string {
    return 'inline-completion';
  }

  /**
   * Clones an existing InlineCompletionNode.
   * @param node - Node to clone
   * @returns New node instance
   */
  static clone(node: InlineCompletionNode): InlineCompletionNode {
    return new InlineCompletionNode(node.__completionText, node.__key);
  }

  /**
   * Creates a new InlineCompletionNode.
   * @param completionText - The ghost text to display
   * @param key - Optional Lexical node key
   */
  constructor(completionText: string, key?: NodeKey) {
    super(key);
    this.__completionText = completionText;
  }

  /**
   * Creates the DOM element for this node.
   * Styled as ghost text with low opacity and pointer-events disabled.
   * @param _config - Editor configuration (unused)
   * @returns Configured span element
   */
  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement('span');
    dom.className = 'inline-completion-ghost';
    dom.style.cssText = `
      opacity: 0.5;
      color: var(--vscode-editorSuggestWidget-foreground, #999);
      pointer-events: none;
      user-select: none;
      white-space: pre;
    `;
    return dom;
  }

  /**
   * Indicates whether DOM element needs updating.
   * @returns Always false - DOM is static
   */
  updateDOM(): false {
    return false;
  }

  /**
   * Deserializes node from JSON.
   * @param serializedNode - Serialized node data
   * @returns New InlineCompletionNode instance
   */
  static importJSON(
    serializedNode: SerializedInlineCompletionNode,
  ): InlineCompletionNode {
    return $createInlineCompletionNode(serializedNode.completionText);
  }

  /**
   * Serializes node to JSON.
   * @returns Serialized node representation
   */
  exportJSON(): SerializedInlineCompletionNode {
    // Don't serialize completion nodes - they're ephemeral ghost text
    // Return minimal structure to satisfy type system
    return {
      completionText: '',
      type: 'inline-completion',
      version: 1,
    };
  }

  /**
   * Disables DOM import for this node type.
   * @returns null - no DOM import support
   */
  static importDOM(): DOMConversionMap | null {
    return null;
  }

  /**
   * Disables DOM export for this node type.
   * @returns Empty export output
   */
  exportDOM(): DOMExportOutput {
    return { element: null };
  }

  /**
   * Gets the completion text.
   * @returns The ghost text string
   */
  getCompletionText(): string {
    return this.__completionText;
  }

  /**
   * Updates the completion text.
   * @param text - New completion text
   */
  setCompletionText(text: string): void {
    const writable = this.getWritable();
    writable.__completionText = text;
  }

  /**
   * Renders the React component for this decorator node.
   * @returns React element displaying ghost text
   */
  decorate(): React.ReactElement {
    console.warn(
      '[InlineCompletionNode] 🎨 decorate() called with text:',
      this.__completionText.substring(0, 50),
    );
    return <InlineCompletionComponent completionText={this.__completionText} />;
  }

  /**
   * Indicates this is an inline node.
   * @returns Always true
   */
  isInline(): boolean {
    return true;
  }

  /**
   * Prevents keyboard selection of this node.
   * @returns Always false - ghost text should not be selectable
   */
  isKeyboardSelectable(): boolean {
    return false;
  }
}

/**
 * Factory function to create an InlineCompletionNode.
 * @param completionText - The ghost text to display
 * @returns New InlineCompletionNode instance
 *
 * @example
 * ```typescript
 * const node = $createInlineCompletionNode('def fib(n):\n    return n');
 * jupyterInputNode.append(node);
 * ```
 */
export function $createInlineCompletionNode(
  completionText: string,
): InlineCompletionNode {
  return new InlineCompletionNode(completionText);
}

/**
 * Type guard to check if a node is an InlineCompletionNode.
 * @param node - Node to check
 * @returns True if node is InlineCompletionNode
 *
 * @example
 * ```typescript
 * if ($isInlineCompletionNode(node)) {
 *   const text = node.getCompletionText();
 * }
 * ```
 */
export function $isInlineCompletionNode(
  node: LexicalNode | null | undefined,
): node is InlineCompletionNode {
  return node instanceof InlineCompletionNode;
}

/**
 * React component that renders inline completion ghost text.
 * Styled with low opacity to appear as a suggestion rather than actual code.
 *
 * @param props - Component props
 * @returns Styled span with ghost text
 */
function InlineCompletionComponent({
  completionText,
}: InlineCompletionNodeProps): React.ReactElement {
  console.warn(
    '[InlineCompletionComponent] 🖼️ Rendering with text:',
    completionText.substring(0, 50),
  );
  return (
    <span
      className="inline-completion-text"
      style={{
        opacity: 0.5,
        color: 'var(--vscode-editorSuggestWidget-foreground, #999)',
        pointerEvents: 'none',
        userSelect: 'none',
        whiteSpace: 'pre',
      }}
    >
      {completionText}
    </span>
  );
}
