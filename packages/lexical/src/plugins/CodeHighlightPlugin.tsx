/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Plugin to add syntax highlighting and line numbers to regular code blocks (CodeNode).
 *
 * This plugin:
 * 1. Registers Prism-based syntax highlighting using @lexical/code's registerCodeHighlighting
 * 2. Adds line number gutters to code blocks via data-gutter attribute
 *
 * Note: JupyterInputNode has its own highlighting via JupyterInputHighlighter.
 * This plugin only affects regular code blocks (type: "code").
 */

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { registerCodeHighlighting } from '@lexical/code';
import { CodeNode } from '@lexical/code';
import { $isLineBreakNode, $getRoot, $isElementNode } from 'lexical';
import type { LexicalEditor, ElementNode } from 'lexical';

/**
 * Update the gutter attribute on a code block to show line numbers.
 * Similar to updateGutter in JupyterInputHighlighter.ts but for CodeNode.
 */
function updateCodeGutter(node: CodeNode, editor: LexicalEditor) {
  const codeElement = editor.getElementByKey(node.getKey());
  if (codeElement === null) {
    return;
  }

  const children = node.getChildren();
  const childrenLength = children.length;

  // @ts-expect-error: internal field for caching
  if (childrenLength === codeElement.__cachedChildrenLength) {
    // Avoid updating the attribute if the children length hasn't changed.
    return;
  }
  // @ts-expect-error: internal field for caching
  codeElement.__cachedChildrenLength = childrenLength;

  // Generate gutter line numbers
  let gutter = '1';
  let count = 1;
  for (let i = 0; i < childrenLength; i++) {
    if ($isLineBreakNode(children[i])) {
      gutter += '\n' + ++count;
    }
  }

  codeElement.setAttribute('data-gutter', gutter);
}

/**
 * Recursively find all CodeNode instances in the editor tree
 */
function findAllCodeNodes(node: ElementNode): CodeNode[] {
  const codeNodes: CodeNode[] = [];

  if (node instanceof CodeNode) {
    codeNodes.push(node);
  }

  if ($isElementNode(node)) {
    const children = node.getChildren();
    for (const child of children) {
      if ($isElementNode(child)) {
        codeNodes.push(...findAllCodeNodes(child));
      }
    }
  }

  return codeNodes;
}

/**
 * Plugin component that registers code highlighting and line number gutters for CodeNode blocks.
 * This is separate from JupyterInputNode highlighting which is handled by JupyterInputOutputPlugin.
 */
export function CodeBlockHighlightPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Register syntax highlighting with Prism
    const removeHighlighting = registerCodeHighlighting(editor);

    // Register node transform to update line number gutters
    const removeGutterTransform = editor.registerNodeTransform(
      CodeNode,
      (node: CodeNode) => {
        updateCodeGutter(node, editor);
      },
    );

    // Process existing CodeNode blocks immediately
    editor.getEditorState().read(() => {
      const root = $getRoot();
      const codeNodes = findAllCodeNodes(root);

      // Trigger gutter updates for each existing CodeNode
      codeNodes.forEach(node => {
        updateCodeGutter(node, editor);
      });
    });

    // Cleanup on unmount
    return () => {
      removeHighlighting();
      removeGutterTransform();
    };
  }, [editor]);

  return null;
}
