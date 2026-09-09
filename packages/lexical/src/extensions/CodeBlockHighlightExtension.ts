/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Syntax highlighting and line numbers for plain code blocks (`CodeNode`),
 * as a Lexical extension.
 *
 * Depends on `CodeExtension` for the nodes, registers Prism highlighting
 * through `@lexical/code`, and keeps a `data-gutter` attribute of line
 * numbers on every block. `JupyterInputNode` has its own highlighter; this
 * only concerns regular code blocks.
 *
 * @module extensions/CodeBlockHighlightExtension
 */

import {
  CodeExtension,
  CodeNode,
  registerCodeHighlighting,
} from '@lexical/code';
import { mergeRegister } from '@lexical/utils';
import {
  $getRoot,
  $isElementNode,
  $isLineBreakNode,
  defineExtension,
  type ElementNode,
  type LexicalEditor,
} from 'lexical';

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
  let gutter = '1';
  let count = 1;
  for (let i = 0; i < childrenLength; i++) {
    if ($isLineBreakNode(children[i])) {
      gutter += '\n' + ++count;
    }
  }
  codeElement.setAttribute('data-gutter', gutter);
}

/** Every `CodeNode` under `node`, depth first. */
function findAllCodeNodes(node: ElementNode): CodeNode[] {
  const codeNodes: CodeNode[] = [];
  if (node instanceof CodeNode) {
    codeNodes.push(node);
  }
  if ($isElementNode(node)) {
    for (const child of node.getChildren()) {
      if ($isElementNode(child)) {
        codeNodes.push(...findAllCodeNodes(child));
      }
    }
  }
  return codeNodes;
}

/**
 * Register code highlighting and the line-number gutter on `editor`.
 *
 * @returns The function that removes both again.
 */
export function registerCodeBlockHighlight(editor: LexicalEditor): () => void {
  const removeAll = mergeRegister(
    registerCodeHighlighting(editor),
    editor.registerNodeTransform(CodeNode, (node: CodeNode) => {
      updateCodeGutter(node, editor);
    }),
  );
  // Blocks that are already there get their gutter now, not on their next edit.
  editor.getEditorState().read(() => {
    for (const node of findAllCodeNodes($getRoot())) {
      updateCodeGutter(node, editor);
    }
  });
  return removeAll;
}

export const CodeBlockHighlightExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/CodeBlockHighlight',
  dependencies: [CodeExtension],
  register: registerCodeBlockHighlight,
});
