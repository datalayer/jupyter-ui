/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Utilities for converting between Lexical editor state and LexicalBlock format.
 * Used by message handlers to serialize/deserialize blocks for tool operations.
 *
 * @module utils/blocks
 */

import type { LexicalEditor, LexicalNode } from 'lexical';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
  type HeadingTagType,
} from '@lexical/rich-text';
import { $createCodeNode, $isCodeNode } from '@lexical/code';
import {
  $createListNode,
  $createListItemNode,
  $isListNode,
} from '@lexical/list';
import type { LexicalBlock } from '../core/types';

/**
 * Convert Lexical editor state to an array of LexicalBlocks.
 * Reads the current editor state and serializes top-level blocks.
 */
export function editorStateToBlocks(editor: LexicalEditor): LexicalBlock[] {
  const blocks: LexicalBlock[] = [];

  editor.getEditorState().read(() => {
    const root = $getRoot();
    const children = root.getChildren();

    for (const child of children) {
      const block = nodeToBlock(child);
      if (block) {
        blocks.push(block);
      }
    }
  });

  return blocks;
}

/**
 * Convert a Lexical node to a LexicalBlock.
 * Returns Jupyter-style format with block_id, block_type, source, and metadata.
 */
export function nodeToBlock(node: LexicalNode): LexicalBlock | null {
  const type = node.getType();
  const block_id = node.getKey(); // Lexical's stable node identifier

  // Heading
  if ($isHeadingNode(node)) {
    const tag = node.getTag();
    const level = parseInt(tag.substring(1)); // h1 -> 1, h2 -> 2, etc.
    const { text, formatting } = extractTextAndFormatting(node);
    return {
      block_id,
      block_type: 'heading',
      source: text,
      metadata: { level },
      formatting,
    };
  }

  // Quote
  if ($isQuoteNode(node)) {
    const { text, formatting } = extractTextAndFormatting(node);
    return {
      block_id,
      block_type: 'quote',
      source: text,
      formatting,
    };
  }

  // Code
  if ($isCodeNode(node)) {
    const language = node.getLanguage() || 'plaintext';
    const text = node.getTextContent();
    return {
      block_id,
      block_type: 'code',
      source: text,
      metadata: { language },
    };
  }

  // List
  if ($isListNode(node)) {
    const listTypeMap: Record<string, 'bullet' | 'number' | 'check'> = {
      bullet: 'bullet',
      number: 'number',
      check: 'check',
    };
    const list_type = listTypeMap[node.getListType()] || 'bullet';
    const { text, formatting } = extractTextAndFormatting(node);
    return {
      block_id,
      block_type: 'list',
      source: text,
      metadata: { list_type },
      formatting,
    };
  }

  // List item
  if (type === 'listitem') {
    const { text, formatting } = extractTextAndFormatting(node);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const checked = (node as any).getChecked?.() ?? undefined;
    return {
      block_id,
      block_type: 'listitem',
      source: text,
      metadata: checked !== undefined ? { checked } : undefined,
      formatting,
    };
  }

  // Paragraph (default)
  if (type === 'paragraph') {
    const { text, formatting } = extractTextAndFormatting(node);
    return {
      block_id,
      block_type: 'paragraph',
      source: text,
      formatting,
    };
  }

  // Jupyter cell
  if (type === 'jupyter-cell') {
    const text = node.getTextContent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodeAny = node as any;
    const language = nodeAny.getLanguage?.() || 'python';
    const outputs = nodeAny.getOutputs?.() || [];
    return {
      block_id,
      block_type: 'jupyter-cell',
      source: text,
      metadata: {
        language,
        outputs: outputs.length > 0 ? outputs : undefined,
      },
    };
  }

  // Image
  if (type === 'image') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodeAny = node as any;
    const src = nodeAny.getSrc?.() || nodeAny.__src || '';
    const alt_text = nodeAny.getAltText?.() || nodeAny.__altText || '';
    return {
      block_id,
      block_type: 'image',
      source: '',
      metadata: { src, alt_text },
    };
  }

  // Equation
  if (type === 'equation') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodeAny = node as any;
    const latex = nodeAny.getEquation?.() || nodeAny.__equation || '';
    const inline = nodeAny.getInline?.() ?? nodeAny.__inline ?? false;
    return {
      block_id,
      block_type: 'equation',
      source: latex,
      metadata: { latex, inline },
    };
  }

  // Table
  if (type === 'table') {
    const text = node.getTextContent();
    return {
      block_id,
      block_type: 'table',
      source: text,
    };
  }

  // Unknown types - return as generic block to avoid data loss
  console.warn(
    `[nodeToBlock] Unknown block type: ${type}, returning generic block`,
  );
  const text = node.getTextContent();
  return {
    block_id,
    block_type: type,
    source: text,
  };
}

/**
 * Extract text content and inline formatting from a Lexical node.
 * Returns both plain text (for source) and formatting array (for rich text).
 */
function extractTextAndFormatting(node: LexicalNode): {
  text: string;
  formatting?: Array<{ text: string; format?: number }>;
} {
  const formatting: Array<{ text: string; format?: number }> = [];
  let hasFormatting = false;

  // Get text content
  const text = node.getTextContent();

  // Try to extract formatted children
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children = 'getChildren' in node ? (node as any).getChildren() : [];
  if (children.length > 0) {
    for (const child of children) {
      if (child.getType() === 'text') {
        const childText = child.getTextContent();
        const childFormat = child.getFormat?.() || 0;
        formatting.push({ text: childText, format: childFormat });
        if (childFormat !== 0) {
          hasFormatting = true;
        }
      } else {
        // Nested node - recursively extract
        const nested = extractTextAndFormatting(child);
        if (nested.formatting) {
          formatting.push(...nested.formatting);
          hasFormatting = true;
        } else {
          formatting.push({ text: nested.text, format: 0 });
        }
      }
    }
  } else {
    // Leaf node
    const format =
      'getFormat' in node
        ? (node as { getFormat?: () => number }).getFormat?.() || 0
        : 0;
    formatting.push({ text, format });
    if (format !== 0) {
      hasFormatting = true;
    }
  }

  return {
    text,
    formatting: hasFormatting && formatting.length > 0 ? formatting : undefined,
  };
}

/**
 * Insert a LexicalBlock into the editor at the specified index or after a block ID.
 * Creates the appropriate Lexical node based on block type.
 *
 * @param editor - Lexical editor instance
 * @param block - Block to insert
 * @param index - Index where to insert (0-based), or -1 to append
 * @param afterBlockId - Optional: Insert after this block ID instead of using index
 */
export function insertBlock(
  editor: LexicalEditor,
  block: LexicalBlock,
  index: number,
  afterBlockId?: string,
): void {
  console.log(
    `[lexicalBlockUtils] insertBlock called: index=${index}, afterBlockId=${afterBlockId}, block type=${block.block_type}`,
  );

  editor.update(() => {
    console.log(`[lexicalBlockUtils] Inside editor.update()`);
    const root = $getRoot();
    const node = blockToNode(block);

    if (!node) {
      console.error(
        `[lexicalBlockUtils] Failed to create node for block type: ${block.block_type}`,
      );
      throw new Error(`Unsupported block type: ${block.block_type}`);
    }

    console.log(`[lexicalBlockUtils] Created node:`, node.getType());

    const children = root.getChildren();
    console.log(
      `[lexicalBlockUtils] Current children count: ${children.length}, target afterBlockId: ${afterBlockId}`,
    );

    // Handle special values for afterBlockId
    if (afterBlockId === 'TOP') {
      console.log(`[lexicalBlockUtils] Inserting at TOP (beginning)`);
      if (children.length > 0) {
        children[0].insertBefore(node);
      } else {
        root.append(node);
      }
      console.log(`[lexicalBlockUtils] ✓ Block inserted at beginning`);
      return;
    }

    if (afterBlockId === 'BOTTOM' || !afterBlockId) {
      console.log(`[lexicalBlockUtils] Inserting at BOTTOM (end)`);
      root.append(node);
      console.log(`[lexicalBlockUtils] ✓ Block appended to end`);
      return;
    }

    // Otherwise, find the block by ID and insert after it
    const targetBlock = children.find(child => child.getKey() === afterBlockId);
    if (targetBlock) {
      console.log(
        `[lexicalBlockUtils] Inserting after block ID: ${afterBlockId}`,
      );
      targetBlock.insertAfter(node);
      console.log(`[lexicalBlockUtils] ✓ Block inserted after ${afterBlockId}`);
    } else {
      throw new Error(
        `Block ID ${afterBlockId} not found. Use readBlocks to get valid block IDs, or use 'TOP'/'BOTTOM' for beginning/end.`,
      );
    }

    console.log(`[lexicalBlockUtils] ✓ Block inserted successfully`);
  });

  console.log(`[lexicalBlockUtils] editor.update() completed`);
}

/**
 * Delete a block from the editor at the specified index.
 */
export function deleteBlock(editor: LexicalEditor, index: number): void {
  editor.update(() => {
    const root = $getRoot();
    const children = root.getChildren();

    if (index < 0 || index >= children.length) {
      throw new Error(`Block index out of range: ${index}`);
    }

    children[index].remove();
  });
}

/**
 * Update a block in the editor at the specified index.
 */
export function updateBlock(
  editor: LexicalEditor,
  index: number,
  block: LexicalBlock,
): void {
  editor.update(() => {
    const root = $getRoot();
    const children = root.getChildren();

    if (index < 0 || index >= children.length) {
      throw new Error(`Block index out of range: ${index}`);
    }

    const newNode = blockToNode(block);
    if (!newNode) {
      throw new Error(`Unsupported block type: ${block.block_type}`);
    }

    // Replace old node with new node
    const oldNode = children[index];
    oldNode.replace(newNode);
  });
}

/**
 * Convert a LexicalBlock to a Lexical node.
 * Creates the appropriate node type with content.
 */
function blockToNode(block: LexicalBlock): LexicalNode | null {
  // Get source as string
  const textContent = Array.isArray(block.source)
    ? block.source.join('\n')
    : block.source;

  // Helper to create text nodes with formatting
  const createTextNodes = (): LexicalNode[] => {
    if (block.formatting && block.formatting.length > 0) {
      // Create separate text nodes for each formatted segment
      return block.formatting.map(seg => {
        const textNode = $createTextNode(seg.text);
        if (seg.format) {
          textNode.setFormat(seg.format);
        }
        return textNode;
      });
    } else {
      // Simple text node
      return [textContent ? $createTextNode(textContent) : $createTextNode('')];
    }
  };

  switch (block.block_type) {
    case 'paragraph': {
      const paragraph = $createParagraphNode();
      createTextNodes().forEach(node => paragraph.append(node));
      return paragraph;
    }

    case 'heading': {
      const level = block.metadata?.level || 1;
      const tag = `h${level}` as HeadingTagType;
      const heading = $createHeadingNode(tag);
      createTextNodes().forEach(node => heading.append(node));
      return heading;
    }

    case 'code': {
      const language = (block.metadata?.language as string) || 'plaintext';
      const code = $createCodeNode(language);
      code.append($createTextNode(textContent));
      return code;
    }

    case 'quote': {
      const quote = $createQuoteNode();
      createTextNodes().forEach(node => quote.append(node));
      return quote;
    }

    case 'list': {
      const list_type = block.metadata?.list_type || 'bullet';
      const list = $createListNode(list_type);
      const listItem = $createListItemNode();
      createTextNodes().forEach(node => listItem.append(node));
      list.append(listItem);
      return list;
    }

    case 'listitem': {
      const listItem = $createListItemNode();
      if (block.metadata?.checked !== undefined) {
        listItem.setChecked(block.metadata.checked);
      }
      createTextNodes().forEach(node => listItem.append(node));
      return listItem;
    }

    default:
      // For unsupported types (jupyter-cell, image, equation), return null
      // These should be handled via command dispatch instead
      console.warn(
        `[blockToNode] Unsupported block type for node creation: ${block.block_type}`,
      );
      return null;
  }
}

/**
 * Get the count of top-level blocks in the editor.
 */
export function getBlockCount(editor: LexicalEditor): number {
  let count = 0;
  editor.getEditorState().read(() => {
    const root = $getRoot();
    count = root.getChildren().length;
  });
  return count;
}

/**
 * Get a specific block by index.
 */
export function getBlock(
  editor: LexicalEditor,
  index: number,
): LexicalBlock | null {
  let block: LexicalBlock | null = null;

  editor.getEditorState().read(() => {
    const root = $getRoot();
    const children = root.getChildren();

    if (index >= 0 && index < children.length) {
      block = nodeToBlock(children[index]);
    }
  });

  return block;
}

/**
 * Get registered node types from the editor.
 * Returns type names and class names of all registered Lexical nodes.
 */
export function getRegisteredNodes(
  editor: LexicalEditor,
): Array<{ type: string; className?: string }> {
  const registeredNodes: Array<{ type: string; className?: string }> = [];

  // Access the editor's internal _nodes Map
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorInternal = editor as any;
  if (editorInternal._nodes) {
    const nodesMap = editorInternal._nodes as Map<
      string,
      { klass: { name: string } }
    >;
    for (const [type, { klass }] of nodesMap.entries()) {
      registeredNodes.push({
        type,
        className: klass.name,
      });
    }
  }

  return registeredNodes;
}
