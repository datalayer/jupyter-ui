/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

// eslint-disable-next-line simple-import-sort/imports
import type {LexicalCommand, LexicalEditor, LexicalNode} from 'lexical';
import * as Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-objectivec';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-swift';
import {mergeRegister} from '@lexical/utils';
import {
  $createLineBreakNode,
  $createTextNode,
  $getNodeByKey,
  $getSelection,
  $isLineBreakNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  INDENT_CONTENT_COMMAND,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  MOVE_TO_END,
  MOVE_TO_START,
  OUTDENT_CONTENT_COMMAND,
  TextNode,
} from 'lexical';
import {
  $createJupyterCodeHighlightNode,
  $isJupyterCodeHighlightNode,
  JupyterCodeHighlightNode,
  DEFAULT_CODE_LANGUAGE,
  getFirstJupyterCodeHighlightNodeOfLine,
  getLastJupyterCodeHighlightNodeOfLine,
} from './JupyterCodeHighlightNode';
import {$isJupyterCodeNode, JupyterCodeNode} from './JupyterCodeNode';

function isSpaceOrTabChar(char: string): boolean {
  return char === ' ' || char === '\t';
}

function findFirstNotSpaceOrTabCharAtText(
  text: string,
  isForward: boolean,
): number {
  const length = text.length;
  let offset = -1;

  if (isForward) {
    for (let i = 0; i < length; i++) {
      const char = text[i];
      if (!isSpaceOrTabChar(char)) {
        offset = i;
        break;
      }
    }
  } else {
    for (let i = length - 1; i > -1; i--) {
      const char = text[i];
      if (!isSpaceOrTabChar(char)) {
        offset = i;
        break;
      }
    }
  }
  return offset;
}

export function getStartOfCodeInLine(anchor: LexicalNode): {
  node: TextNode | null;
  offset: number;
} {
  let currentNode = null;
  let currentNodeOffset = -1;
  const previousSiblings = anchor.getPreviousSiblings();
  previousSiblings.push(anchor);
  while (previousSiblings.length > 0) {
    const node = previousSiblings.pop();
    if ($isJupyterCodeHighlightNode(node)) {
      const text = node.getTextContent();
      const offset = findFirstNotSpaceOrTabCharAtText(text, true);
      if (offset !== -1) {
        currentNode = node;
        currentNodeOffset = offset;
      }
    }
    if ($isLineBreakNode(node)) {
      break;
    }
  }

  if (currentNode === null) {
    const nextSiblings = anchor.getNextSiblings();
    while (nextSiblings.length > 0) {
      const node = nextSiblings.shift();
      if ($isJupyterCodeHighlightNode(node)) {
        const text = node.getTextContent();
        const offset = findFirstNotSpaceOrTabCharAtText(text, true);
        if (offset !== -1) {
          currentNode = node;
          currentNodeOffset = offset;
          break;
        }
      }
      if ($isLineBreakNode(node)) {
        break;
      }
    }
  }

  return {
    node: currentNode,
    offset: currentNodeOffset,
  };
}

export function getEndOfJupyterCodeInLine(anchor: LexicalNode): {
  node: TextNode | null;
  offset: number;
} {
  let currentNode = null;
  let currentNodeOffset = -1;
  const nextSiblings = anchor.getNextSiblings();
  nextSiblings.unshift(anchor);
  while (nextSiblings.length > 0) {
    const node = nextSiblings.shift();
    if ($isJupyterCodeHighlightNode(node)) {
      const text = node.getTextContent();
      const offset = findFirstNotSpaceOrTabCharAtText(text, false);
      if (offset !== -1) {
        currentNode = node;
        currentNodeOffset = offset + 1;
      }
    }
    if ($isLineBreakNode(node)) {
      break;
    }
  }

  if (currentNode === null) {
    const previousSiblings = anchor.getPreviousSiblings();
    while (previousSiblings.length > 0) {
      const node = previousSiblings.pop();
      if ($isJupyterCodeHighlightNode(node)) {
        const text = node.getTextContent();
        const offset = findFirstNotSpaceOrTabCharAtText(text, false);
        if (offset !== -1) {
          currentNode = node;
          currentNodeOffset = offset + 1;
          break;
        }
      }
      if ($isLineBreakNode(node)) {
        break;
      }
    }
  }

  return {
    node: currentNode,
    offset: currentNodeOffset,
  };
}

function textNodeTransform(node: TextNode, editor: LexicalEditor): void {
  // Since CodeNode has flat children structure we only need to check
  // if node's parent is a code node and run highlighting if so
  const parentNode = node.getParent();
  if (parentNode && $isJupyterCodeNode(parentNode)) {
    codeNodeTransform(parentNode, editor);
  } else if ($isJupyterCodeHighlightNode(node)) {
    // When code block converted into paragraph or other element
    // code highlight nodes converted back to normal text
    node.replace($createTextNode(node.__text));
  }
}

function updateCodeGutter(node: JupyterCodeNode, editor: LexicalEditor): void {
  const codeElement = editor.getElementByKey(node.getKey());
  if (codeElement === null) {
    return;
  }
  const children = node.getChildren();
  const childrenLength = children.length;
  // @ts-ignore: internal field
  if (childrenLength === codeElement.__cachedChildrenLength) {
    // Avoid updating the attribute if the children length hasn't changed.
    return;
  }
  // @ts-ignore:: internal field
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

// Using `skipTransforms` to prevent extra transforms since reformatting the code
// will not affect code block content itself.
//
// Using extra flag (`isHighlighting`) since both CodeNode and CodeHighlightNode
// transforms might be called at the same time (e.g. new CodeHighlight node inserted) and
// in both cases we'll rerun whole reformatting over CodeNode, which is redundant.
// Especially when pasting code into CodeBlock.
let isHighlighting = false;
function codeNodeTransform(node: JupyterCodeNode, editor: LexicalEditor) {
  if (isHighlighting) {
    return;
  }
  isHighlighting = true;
  // When new code block inserted it might not have language selected
  if (node.getLanguage() === undefined) {
    node.setLanguage(DEFAULT_CODE_LANGUAGE);
  }

  // Using nested update call to pass `skipTransforms` since we don't want
  // each individual codehighlight node to be transformed again as it's already
  // in its final state
  editor.update(
    () => {
      updateAndRetainSelection(node, () => {
        const code = node.getTextContent();
        const tokens = Prism.tokenize(
          code,
          Prism.languages[node.getLanguage() || ''] ||
            Prism.languages[DEFAULT_CODE_LANGUAGE],
        );
        const highlightNodes = getHighlightNodes(tokens);
        const diffRange = getDiffRange(node.getChildren(), highlightNodes);
        const {from, to, nodesForReplacement} = diffRange;
        if (from !== to || nodesForReplacement.length) {
          node.splice(from, to - from, nodesForReplacement);
          return true;
        }
        return false;
      });
    },
    {
      onUpdate: () => {
        isHighlighting = false;
      },
      skipTransforms: true,
    },
  );
}

function getHighlightNodes(
  tokens: (string | Prism.Token)[],
): Array<LexicalNode> {
  const nodes: LexicalNode[] = [];

  tokens.forEach((token) => {
    if (typeof token === 'string') {
      const partials = token.split('\n');
      for (let i = 0; i < partials.length; i++) {
        const text = partials[i];
        if (text.length) {
          nodes.push($createJupyterCodeHighlightNode(text));
        }
        if (i < partials.length - 1) {
          nodes.push($createLineBreakNode());
        }
      }
    } else {
      const {content} = token;
      if (typeof content === 'string') {
        nodes.push($createJupyterCodeHighlightNode(content, token.type));
      } else if (
        Array.isArray(content) &&
        content.length === 1 &&
        typeof content[0] === 'string'
      ) {
        nodes.push($createJupyterCodeHighlightNode(content[0], token.type));
      } else if (Array.isArray(content)) {
        nodes.push(...getHighlightNodes(content));
      }
    }
  });

  return nodes;
}

// Wrapping update function into selection retainer, that tries to keep cursor at the same
// position as before.
function updateAndRetainSelection(
  node: JupyterCodeNode,
  updateFn: () => boolean,
): void {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || !selection.anchor) {
    return;
  }

  const anchor = selection.anchor;
  const anchorOffset = anchor.offset;
  const isNewLineAnchor =
    anchor.type === 'element' &&
    $isLineBreakNode(node.getChildAtIndex(anchor.offset - 1));
  let textOffset = 0;

  // Calculating previous text offset (all text node prior to anchor + anchor own text offset)
  if (!isNewLineAnchor) {
    const anchorNode = anchor.getNode();
    textOffset =
      anchorOffset +
      anchorNode.getPreviousSiblings().reduce((offset, _node) => {
        return (
          offset + ($isLineBreakNode(_node) ? 0 : _node.getTextContentSize())
        );
      }, 0);
  }

  const hasChanges = updateFn();
  if (!hasChanges) {
    return;
  }

  // Non-text anchors only happen for line breaks, otherwise
  // selection will be within text node (code highlight node)
  if (isNewLineAnchor) {
    anchor.getNode().select(anchorOffset, anchorOffset);
    return;
  }

  // If it was non-element anchor then we walk through child nodes
  // and looking for a position of original text offset
  node.getChildren().some((_node) => {
    if ($isTextNode(_node)) {
      const textContentSize = _node.getTextContentSize();
      if (textContentSize >= textOffset) {
        _node.select(textOffset, textOffset);
        return true;
      }
      textOffset -= textContentSize;
    }
    return false;
  });
}

// Finds minimal diff range between two nodes lists. It returns from/to range boundaries of prevNodes
// that needs to be replaced with `nodes` (subset of nextNodes) to make prevNodes equal to nextNodes.
function getDiffRange(
  prevNodes: Array<LexicalNode>,
  nextNodes: Array<LexicalNode>,
): {
  from: number;
  nodesForReplacement: Array<LexicalNode>;
  to: number;
} {
  let leadingMatch = 0;
  while (leadingMatch < prevNodes.length) {
    if (!isEqual(prevNodes[leadingMatch], nextNodes[leadingMatch])) {
      break;
    }
    leadingMatch++;
  }

  const prevNodesLength = prevNodes.length;
  const nextNodesLength = nextNodes.length;
  const maxTrailingMatch =
    Math.min(prevNodesLength, nextNodesLength) - leadingMatch;

  let trailingMatch = 0;
  while (trailingMatch < maxTrailingMatch) {
    trailingMatch++;
    if (
      !isEqual(
        prevNodes[prevNodesLength - trailingMatch],
        nextNodes[nextNodesLength - trailingMatch],
      )
    ) {
      trailingMatch--;
      break;
    }
  }

  const from = leadingMatch;
  const to = prevNodesLength - trailingMatch;
  const nodesForReplacement = nextNodes.slice(
    leadingMatch,
    nextNodesLength - trailingMatch,
  );
  return {
    from,
    nodesForReplacement,
    to,
  };
}

function isEqual(nodeA: LexicalNode, nodeB: LexicalNode): boolean {
  // Only checking for code higlight nodes and linebreaks. If it's regular text node
  // returning false so that it's transformed into code highlight node
  if ($isJupyterCodeHighlightNode(nodeA) && $isJupyterCodeHighlightNode(nodeB)) {
    return (
      nodeA.__text === nodeB.__text &&
      nodeA.__highlightType === nodeB.__highlightType
    );
  }
  if ($isLineBreakNode(nodeA) && $isLineBreakNode(nodeB)) {
    return true;
  }
  return false;
}

function handleMultilineIndent(type: LexicalCommand<void>): boolean {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || selection.isCollapsed()) {
    return false;
  }
  // Only run multiline indent logic on selections exclusively composed of code highlights and linebreaks
  const nodes = selection.getNodes();
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!$isJupyterCodeHighlightNode(node) && !$isLineBreakNode(node)) {
      return false;
    }
  }
  const startOfLine = getFirstJupyterCodeHighlightNodeOfLine(nodes[0]);

  if (startOfLine != null) {
    doIndent(startOfLine, type);
  }

  for (let i = 1; i < nodes.length; i++) {
    const node = nodes[i];
    if ($isLineBreakNode(nodes[i - 1]) && $isJupyterCodeHighlightNode(node)) {
      doIndent(node, type);
    }
  }

  return true;
}

function doIndent(node: JupyterCodeHighlightNode, type: LexicalCommand<void>) {
  const text = node.getTextContent();
  if (type === INDENT_CONTENT_COMMAND) {
    // If the codeblock node doesn't start with whitespace, we don't want to
    // naively prepend a '\t'; Prism will then mangle all of our nodes when
    // it separates the whitespace from the first non-whitespace node. This
    // will lead to selection bugs when indenting lines that previously
    // didn't start with a whitespace character
    if (text.length > 0 && /\s/.test(text[0])) {
      node.setTextContent('\t' + text);
    } else {
      const indentNode = $createJupyterCodeHighlightNode('\t');
      node.insertBefore(indentNode);
    }
  } else {
    if (text.indexOf('\t') === 0) {
      // Same as above - if we leave empty text nodes lying around, the resulting
      // selection will be mangled
      if (text.length === 1) {
        node.remove();
      } else {
        node.setTextContent(text.substring(1));
      }
    }
  }
}

function handleShiftLines(
  type: LexicalCommand<KeyboardEvent>,
  event: KeyboardEvent,
): boolean {
  // We only care about the alt+arrow keys
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return false;
  }
  // I'm not quite sure why, but it seems like calling anchor.getNode() collapses the selection here
  // So first, get the anchor and the focus, then get their nodes
  const {anchor, focus} = selection;
  const anchorOffset = anchor.offset;
  const focusOffset = focus.offset;
  const anchorNode = anchor.getNode();
  const focusNode = focus.getNode();
  const arrowIsUp = type === KEY_ARROW_UP_COMMAND;
  // Ensure the selection is within the codeblock
  if (!$isJupyterCodeHighlightNode(anchorNode) || !$isJupyterCodeHighlightNode(focusNode)) {
    return false;
  }
  if (!event.altKey) {
    // Handle moving selection out of the code block, given there are no
    // sibling thats can natively take the selection.
    if (selection.isCollapsed()) {
      const codeNode = anchorNode.getParentOrThrow();
      if (
        arrowIsUp &&
        anchorOffset === 0 &&
        anchorNode.getPreviousSibling() === null
      ) {
        const codeNodeSibling = codeNode.getPreviousSibling();
        if (codeNodeSibling === null) {
          codeNode.selectPrevious();
          event.preventDefault();
          return true;
        }
      } else if (
        !arrowIsUp &&
        anchorOffset === anchorNode.getTextContentSize() &&
        anchorNode.getNextSibling() === null
      ) {
        const codeNodeSibling = codeNode.getNextSibling();
        if (codeNodeSibling === null) {
          codeNode.selectNext();
          event.preventDefault();
          return true;
        }
      }
    }
    return false;
  }
  const start = getFirstJupyterCodeHighlightNodeOfLine(anchorNode);
  const end = getLastJupyterCodeHighlightNodeOfLine(focusNode);
  if (start == null || end == null) {
    return false;
  }
  const range = start.getNodesBetween(end);
  for (let i = 0; i < range.length; i++) {
    const node = range[i];
    if (!$isJupyterCodeHighlightNode(node) && !$isLineBreakNode(node)) {
      return false;
    }
  }
  // After this point, we know the selection is within the codeblock. We may not be able to
  // actually move the lines around, but we want to return true either way to prevent
  // the event's default behavior
  event.preventDefault();
  event.stopPropagation(); // required to stop cursor movement under Firefox
  const linebreak = arrowIsUp
    ? start.getPreviousSibling()
    : end.getNextSibling();
  if (!$isLineBreakNode(linebreak)) {
    return true;
  }
  const sibling = arrowIsUp
    ? linebreak.getPreviousSibling()
    : linebreak.getNextSibling();
  if (sibling == null) {
    return true;
  }
  const maybeInsertionPoint = arrowIsUp
    ? getFirstJupyterCodeHighlightNodeOfLine(sibling)
    : getLastJupyterCodeHighlightNodeOfLine(sibling);
  let insertionPoint =
    maybeInsertionPoint != null ? maybeInsertionPoint : sibling;
  linebreak.remove();
  range.forEach((node) => node.remove());
  if (type === KEY_ARROW_UP_COMMAND) {
    range.forEach((node) => insertionPoint.insertBefore(node));
    insertionPoint.insertBefore(linebreak);
  } else {
    insertionPoint.insertAfter(linebreak);
    insertionPoint = linebreak;
    range.forEach((node) => {
      insertionPoint.insertAfter(node);
      insertionPoint = node;
    });
  }
  selection.setTextNodeRange(anchorNode, anchorOffset, focusNode, focusOffset);
  return true;
}

function handleMoveTo(
  type: LexicalCommand<KeyboardEvent>,
  event: KeyboardEvent,
): boolean {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return false;
  }
  const {anchor, focus} = selection;
  const anchorNode = anchor.getNode();
  const focusNode = focus.getNode();
  const isMoveToStart = type === MOVE_TO_START;
  if (!$isJupyterCodeHighlightNode(anchorNode) || !$isJupyterCodeHighlightNode(focusNode)) {
    return false;
  }
  let node;
  let offset;
  if (isMoveToStart) {
    ({node, offset} = getStartOfCodeInLine(focusNode));
  } else {
    ({node, offset} = getEndOfJupyterCodeInLine(focusNode));
  }
  if (node !== null && offset !== -1) {
    selection.setTextNodeRange(node, offset, node, offset);
  }
  event.preventDefault();
  event.stopPropagation();
  return true;
}

export function registerCodeHighlighting(editor: LexicalEditor): () => void {
  if (!editor.hasNodes([JupyterCodeNode, JupyterCodeHighlightNode])) {
    throw new Error(
      'CodeHighlightPlugin: CodeNode or CodeHighlightNode not registered on editor',
    );
  }
  return mergeRegister(
    editor.registerMutationListener(JupyterCodeNode, (mutations) => {
      editor.update(() => {
        for (const [key, type] of mutations) {
          if (type !== 'destroyed') {
            const node = $getNodeByKey(key);
            if (node !== null) {
              updateCodeGutter(node as JupyterCodeNode, editor);
            }
          }
        }
      });
    }),
    editor.registerNodeTransform(JupyterCodeNode, (node) =>
      codeNodeTransform(node, editor),
    ),
    editor.registerNodeTransform(TextNode, (node) =>
      textNodeTransform(node, editor),
    ),
    editor.registerNodeTransform(JupyterCodeHighlightNode, (node) =>
      textNodeTransform(node, editor),
    ),
    editor.registerCommand(
      INDENT_CONTENT_COMMAND,
      (payload): boolean => handleMultilineIndent(INDENT_CONTENT_COMMAND),
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      OUTDENT_CONTENT_COMMAND,
      (payload): boolean => handleMultilineIndent(OUTDENT_CONTENT_COMMAND),
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      (payload): boolean => handleShiftLines(KEY_ARROW_UP_COMMAND, payload),
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      (payload): boolean => handleShiftLines(KEY_ARROW_DOWN_COMMAND, payload),
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      MOVE_TO_END,
      (payload): boolean => handleMoveTo(MOVE_TO_END, payload),
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      MOVE_TO_START,
      (payload): boolean => handleMoveTo(MOVE_TO_START, payload),
      COMMAND_PRIORITY_LOW,
    ),
  );
}
