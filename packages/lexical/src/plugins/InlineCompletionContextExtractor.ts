/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Context extraction for inline completions.
 * Handles both code and prose content with configurable scope.
 *
 * @module plugins/InlineCompletionContextExtractor
 */

import type {
  LexicalNode,
  RangeSelection,
  ElementNode,
  ParagraphNode,
} from 'lexical';
import { $getRoot, $isParagraphNode } from 'lexical';
import type { ContentType } from './InlineCompletionConfig';

/**
 * Extracted context for completion requests.
 */
export interface ExtractedContext {
  /** Text before cursor */
  before: string;
  /** Text after cursor */
  after: string;
  /** Full text (for logging/debugging) */
  fullText: string;
}

/**
 * Extract context based on content type and configuration.
 *
 * @param contentType - 'code' or 'prose'
 * @param anchorNode - Node at cursor position
 * @param selection - Current selection state
 * @param contextBefore - Number of blocks before (-1 = all)
 * @param contextAfter - Number of blocks after (-1 = all)
 * @returns Extracted context
 */
export function extractContext(
  contentType: ContentType,
  anchorNode: LexicalNode,
  selection: RangeSelection,
  contextBefore: number,
  contextAfter: number,
): ExtractedContext {
  if (contentType === 'code') {
    return extractCodeContext(anchorNode, selection);
  } else {
    return extractProseContext(
      anchorNode,
      selection,
      contextBefore,
      contextAfter,
    );
  }
}

/**
 * Extract context for code cells (Jupyter).
 * Preserves current behavior: entire cell text before/after cursor.
 *
 * @param jupyterInputNode - The JupyterInputNode containing the code
 * @param selection - Current selection state
 * @returns Extracted context
 */
export function extractCodeContext(
  jupyterInputNode: any,
  selection: RangeSelection,
): ExtractedContext {
  const cellText = jupyterInputNode.getTextContent();
  const cursorOffset = getCursorOffset(jupyterInputNode, selection);

  const before = cellText.substring(0, cursorOffset);
  const after = cellText.substring(cursorOffset);

  return {
    before,
    after,
    fullText: cellText,
  };
}

/**
 * Extract context for prose/markdown text.
 * Supports configurable scope: N blocks before/after or entire document (-1).
 *
 * @param anchorNode - Node at cursor position
 * @param selection - Current selection state
 * @param contextBefore - Number of blocks before cursor (-1 = all)
 * @param contextAfter - Number of blocks after cursor (-1 = all)
 * @returns Extracted context
 */
export function extractProseContext(
  anchorNode: LexicalNode,
  selection: RangeSelection,
  contextBefore: number,
  contextAfter: number,
): ExtractedContext {
  const root = $getRoot();
  const allBlocks = root.getChildren();

  // Find the paragraph/block containing the cursor
  const currentBlock = findParagraphParent(anchorNode);
  if (!currentBlock) {
    // Fallback: return empty context if we can't find current block
    return { before: '', after: '', fullText: '' };
  }

  const currentIndex = allBlocks.indexOf(currentBlock);
  if (currentIndex === -1) {
    // Current block not in root children (shouldn't happen)
    return { before: '', after: '', fullText: '' };
  }

  // Calculate range of blocks to include
  const startIndex =
    contextBefore === -1 ? 0 : Math.max(0, currentIndex - contextBefore);
  const endIndex =
    contextAfter === -1
      ? allBlocks.length - 1
      : Math.min(allBlocks.length - 1, currentIndex + contextAfter);

  // Extract text from blocks before current block
  let beforeText = '';
  for (let i = startIndex; i < currentIndex; i++) {
    beforeText += allBlocks[i].getTextContent() + '\n';
  }

  // Split current block at cursor position
  const currentBlockText = currentBlock.getTextContent();
  const cursorOffsetInBlock = getCursorOffsetInNode(currentBlock, selection);

  beforeText += currentBlockText.substring(0, cursorOffsetInBlock);

  // Extract text from cursor to end of current block
  let afterText = currentBlockText.substring(cursorOffsetInBlock);

  // Extract text from blocks after current block
  for (let i = currentIndex + 1; i <= endIndex; i++) {
    afterText += '\n' + allBlocks[i].getTextContent();
  }

  // Full text for logging
  const fullText = beforeText + afterText;

  return {
    before: beforeText,
    after: afterText,
    fullText,
  };
}

/**
 * Find the paragraph or block-level parent of a node.
 *
 * @param node - Starting node
 * @returns Parent paragraph/block node or null
 */
function findParagraphParent(node: LexicalNode): ElementNode | null {
  let current: LexicalNode | null = node;

  while (current) {
    // Check if current node is a block-level element
    if ($isParagraphNode(current)) {
      return current as ParagraphNode;
    }

    // For headings, lists, etc. - check if it's an ElementNode
    if (current.getType() === 'heading' || current.getType() === 'listitem') {
      return current as ElementNode;
    }

    current = current.getParent();
  }

  // Fallback: return root if we can't find a specific block
  return $getRoot();
}

/**
 * Get cursor offset within a specific node.
 *
 * @param node - The node to measure offset within
 * @param selection - Current selection state
 * @returns Offset of cursor in node's text
 */
function getCursorOffsetInNode(
  node: ElementNode,
  selection: RangeSelection,
): number {
  try {
    const firstDescendant = node.getFirstDescendant();
    const startKey = firstDescendant ? firstDescendant.getKey() : node.getKey();
    const startOffset = 0;
    const startType = firstDescendant
      ? ('text' as const)
      : ('element' as const);

    const tempSelection = selection.clone();
    tempSelection.anchor.set(startKey, startOffset, startType);
    tempSelection.focus.set(
      selection.anchor.key,
      selection.anchor.offset,
      selection.anchor.type,
    );

    return tempSelection.getTextContent().length;
  } catch (e) {
    console.error('[ContextExtractor] Error getting cursor offset:', e);
    return 0;
  }
}

/**
 * Get accurate cursor offset using Lexical selection API.
 * Used for code cells.
 *
 * @param jupyterInputNode - The JupyterInputNode
 * @param selection - Current selection state
 * @returns Cursor offset in cell text
 */
function getCursorOffset(jupyterInputNode: any, selection: any): number {
  try {
    const firstDescendant = jupyterInputNode.getFirstDescendant();
    const startKey = firstDescendant
      ? firstDescendant.getKey()
      : jupyterInputNode.getKey();
    const startOffset = 0;
    const startType = firstDescendant
      ? ('text' as const)
      : ('element' as const);

    const tempSelection = selection.clone();
    tempSelection.anchor.set(startKey, startOffset, startType);
    tempSelection.focus.set(
      selection.anchor.key,
      selection.anchor.offset,
      selection.anchor.type,
    );

    return tempSelection.getTextContent().length;
  } catch (e) {
    console.error('[ContextExtractor] Error getting cursor offset:', e);
    return 0;
  }
}
