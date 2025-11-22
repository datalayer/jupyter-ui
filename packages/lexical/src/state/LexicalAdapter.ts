/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Adapter for Lexical editor operations.
 *
 * This adapter provides a clean API for document manipulation,
 * handling the complexity of different node types (simple nodes vs.
 * plugin-based nodes like jupyter-cell, image, equation).
 *
 * Mirrors the Notebook2Adapter pattern for consistency across the codebase.
 *
 * @module tools/state/LexicalAdapter
 */

import type { LexicalEditor } from 'lexical';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import {
  $createHeadingNode,
  $createQuoteNode,
  type HeadingTagType,
} from '@lexical/rich-text';
import { $createCodeNode } from '@lexical/code';
import { $createListNode, $createListItemNode } from '@lexical/list';
import type { IOutput } from '@jupyterlab/nbformat';
import type { LexicalBlock } from '../tools/core/types';
import { nodeToBlock } from '../tools/utils/blocks';

/**
 * Result of a document operation
 */
export interface OperationResult {
  success: boolean;
  error?: string;
  blockId?: string; // For insert operations
}

/**
 * Adapter for high-level Lexical document operations.
 * Wraps the LexicalEditor and provides a clean API for tool operations.
 *
 * This class mirrors Notebook2Adapter, providing:
 * - State management compatibility
 * - Consistent API surface for tool operations
 * - Separation of concerns between state and editor
 */
export class LexicalAdapter {
  private _editor: LexicalEditor;
  private _defaultBlockType: string = 'paragraph';

  constructor(editor: LexicalEditor) {
    this._editor = editor;
  }

  /**
   * Get the underlying Lexical editor instance.
   */
  get editor(): LexicalEditor {
    return this._editor;
  }

  /**
   * Set the default block type for new blocks.
   * Similar to Notebook2Adapter.setDefaultCellType()
   */
  setDefaultBlockType(type: string): void {
    this._defaultBlockType = type;
  }

  /**
   * Get the default block type for new blocks.
   */
  get defaultBlockType(): string {
    return this._defaultBlockType;
  }

  /**
   * Get all blocks from the document
   */
  async getBlocks(): Promise<LexicalBlock[]> {
    return new Promise(resolve => {
      this._editor.getEditorState().read(() => {
        const root = $getRoot();
        const children = root.getChildren();
        const blocks = children
          .map(node => nodeToBlock(node))
          .filter((b): b is LexicalBlock => b !== null);
        resolve(blocks);
      });
    });
  }

  /**
   * Get a specific block by index
   */
  async getBlock(index: number): Promise<LexicalBlock | null> {
    return new Promise(resolve => {
      this._editor.getEditorState().read(() => {
        const root = $getRoot();
        const children = root.getChildren();
        if (index >= 0 && index < children.length) {
          resolve(nodeToBlock(children[index]));
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Get a block by ID
   */
  async getBlockById(blockId: string): Promise<LexicalBlock | null> {
    return new Promise(resolve => {
      this._editor.getEditorState().read(() => {
        const root = $getRoot();
        const children = root.getChildren();
        const node = children.find(child => child.getKey() === blockId);
        if (node) {
          resolve(nodeToBlock(node));
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Get the count of blocks in the document
   */
  async getBlockCount(): Promise<number> {
    const blocks = await this.getBlocks();
    return blocks.length;
  }

  /**
   * Insert a block into the document.
   * Handles all block types including complex ones like jupyter-cell.
   *
   * @param block - Block to insert
   * @param afterBlockId - Insert after this block ID ('TOP', 'BOTTOM', or actual ID)
   */
  async insertBlock(
    block: LexicalBlock,
    afterBlockId: string,
  ): Promise<OperationResult> {
    // Debug logging removed to satisfy ESLint no-console rule
    // console.log(`[LexicalAdapter] insertBlock: type=${block.block_type}, afterBlockId=${afterBlockId}`);

    // Handle special block types that require commands
    if (this.requiresCommand(block.block_type)) {
      return this.insertViaCommand(block, afterBlockId);
    }

    // Handle simple block types via direct node creation
    return this.insertViaNode(block, afterBlockId);
  }

  /**
   * Insert multiple blocks into the document in a single transaction.
   * More efficient than multiple insertBlock calls.
   *
   * @param blocks - Array of blocks to insert
   * @param afterBlockId - Insert first block after this ID, subsequent blocks follow in order
   */
  async insertBlocks(
    blocks: LexicalBlock[],
    afterBlockId: string,
  ): Promise<OperationResult> {
    // Debug logging removed to satisfy ESLint no-console rule
    // console.log(`[LexicalAdapter] insertBlocks: count=${blocks.length}, afterBlockId=${afterBlockId}`);

    if (blocks.length === 0) {
      return { success: true };
    }

    // Insert blocks sequentially, each after the previous
    let currentAfterBlockId = afterBlockId;
    const insertedBlockIds: string[] = [];

    for (const block of blocks) {
      const result = await this.insertBlock(block, currentAfterBlockId);

      if (!result.success) {
        return {
          success: false,
          error: `Failed to insert block ${blocks.indexOf(block) + 1}/${blocks.length}: ${result.error}`,
        };
      }

      // If we got a blockId back, use it for the next insertion
      if (result.blockId) {
        currentAfterBlockId = result.blockId;
        insertedBlockIds.push(result.blockId);
      }
    }

    return {
      success: true,
      blockId:
        insertedBlockIds.length > 0
          ? insertedBlockIds[insertedBlockIds.length - 1]
          : undefined,
    };
  }

  /**
   * Delete a block by ID
   */
  async deleteBlock(blockId: string): Promise<OperationResult> {
    return new Promise(resolve => {
      this._editor.update(() => {
        try {
          const root = $getRoot();
          const children = root.getChildren();
          const node = children.find(child => child.getKey() === blockId);

          if (!node) {
            resolve({
              success: false,
              error: `Block with ID ${blockId} not found`,
            });
            return;
          }

          node.remove();
          resolve({ success: true });
        } catch (error) {
          resolve({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });
    });
  }

  /**
   * Update a block by ID
   */
  async updateBlock(
    blockId: string,
    block: LexicalBlock,
  ): Promise<OperationResult> {
    // For now, implement as delete + insert
    const deleteResult = await this.deleteBlock(blockId);
    if (!deleteResult.success) {
      return deleteResult;
    }

    // Find the block before the deleted one to insert after it
    const blocks = await this.getBlocks();
    const deletedIndex = blocks.findIndex(b => b.block_id === blockId);
    const insertAfterId =
      deletedIndex > 0 ? blocks[deletedIndex - 1].block_id : 'TOP';

    return this.insertBlock(block, insertAfterId);
  }

  /**
   * Run a specific block (jupyter-cell only)
   */
  async runBlock(blockId: string): Promise<OperationResult> {
    const block = await this.getBlockById(blockId);
    if (!block) {
      return {
        success: false,
        error: `Block with ID ${blockId} not found`,
      };
    }

    if (block.block_type !== 'jupyter-cell') {
      return {
        success: false,
        error: `Block type ${block.block_type} is not executable`,
      };
    }

    // TODO: Implement actual execution logic
    // This would dispatch a RUN command to the jupyter plugin
    // Debug logging removed to satisfy ESLint no-console rule

    return { success: true };
  }

  /**
   * Run all executable blocks in the document
   */
  async runAllBlocks(): Promise<OperationResult> {
    const blocks = await this.getBlocks();
    const executableBlocks = blocks.filter(
      b => b.block_type === 'jupyter-cell',
    );

    // Debug logging removed to satisfy ESLint no-console rule
    // console.log(`[LexicalAdapter] Running ${executableBlocks.length} executable blocks`);

    for (const block of executableBlocks) {
      const result = await this.runBlock(block.block_id);
      if (!result.success) {
        return {
          success: false,
          error: `Failed to run block ${block.block_id}: ${result.error}`,
        };
      }
    }

    return {
      success: true,
      blockId:
        executableBlocks.length > 0
          ? executableBlocks[executableBlocks.length - 1].block_id
          : undefined,
    };
  }

  /**
   * Check if a block type requires command-based insertion
   */
  private requiresCommand(blockType: string): boolean {
    return ['jupyter-cell', 'image', 'equation'].includes(blockType);
  }

  /**
   * Insert a block using editor commands (for complex types)
   */
  private async insertViaCommand(
    block: LexicalBlock,
    afterBlockId: string,
  ): Promise<OperationResult> {
    // Debug logging removed to satisfy ESLint no-console rule
    // console.log(`[LexicalAdapter] Inserting ${block.block_type} via command`);

    // Import commands dynamically to avoid circular dependencies
    const { INSERT_JUPYTER_INPUT_OUTPUT_COMMAND } = await import(
      '../plugins/JupyterInputOutputPlugin'
    );

    return new Promise(resolve => {
      try {
        // For jupyter-cell, we need to:
        // 1. Create a placeholder paragraph at the target location
        // 2. Dispatch the command to insert the jupyter cell
        // 3. Remove the placeholder

        this._editor.update(() => {
          const root = $getRoot();
          const children = root.getChildren();

          // Create a temporary marker paragraph
          const marker = $createParagraphNode();
          marker.append($createTextNode('__JUPYTER_CELL_MARKER__'));

          // Insert marker at the target position
          if (afterBlockId === 'TOP') {
            if (children.length > 0) {
              children[0].insertBefore(marker);
            } else {
              root.append(marker);
            }
          } else if (afterBlockId === 'BOTTOM' || !afterBlockId) {
            root.append(marker);
          } else {
            const targetBlock = children.find(
              child => child.getKey() === afterBlockId,
            );
            if (targetBlock) {
              targetBlock.insertAfter(marker);
            } else {
              throw new Error(`Block ID ${afterBlockId} not found`);
            }
          }
        });

        // Now dispatch the command to insert jupyter cell
        const source = Array.isArray(block.source)
          ? block.source.join('\n')
          : block.source;

        const commandPayload = {
          code: source,
          outputs: (block.metadata?.outputs || []) as IOutput[],
          loading: '',
        };

        // Dispatch the command - this will be handled by the jupyter plugin
        setTimeout(() => {
          this._editor.update(() => {
            // Find and select the marker
            const root = $getRoot();
            const children = root.getChildren();
            const markerNode = children.find(
              child =>
                child.getType() === 'paragraph' &&
                child.getTextContent() === '__JUPYTER_CELL_MARKER__',
            );

            if (markerNode) {
              // Select the marker node before removing it
              // This ensures the INSERT command will insert at this position
              markerNode.selectEnd();
              // Remove the marker - the command will insert at selection
              markerNode.remove();
            }
          });

          // Dispatch the insert command
          this._editor.dispatchCommand(
            INSERT_JUPYTER_INPUT_OUTPUT_COMMAND,
            commandPayload,
          );

          resolve({ success: true });
        }, 10);
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  /**
   * Insert a block using direct node creation (for simple types)
   */
  private async insertViaNode(
    block: LexicalBlock,
    afterBlockId: string,
  ): Promise<OperationResult> {
    // Debug logging removed to satisfy ESLint no-console rule
    // console.log(`[LexicalAdapter] Inserting ${block.block_type} via node creation`);

    return new Promise(resolve => {
      this._editor.update(() => {
        try {
          const root = $getRoot();
          const node = this.createSimpleNode(block);

          if (!node) {
            resolve({
              success: false,
              error: `Failed to create node for type: ${block.block_type}`,
            });
            return;
          }

          const children = root.getChildren();

          // Insert at target position
          if (afterBlockId === 'TOP') {
            if (children.length > 0) {
              children[0].insertBefore(node);
            } else {
              root.append(node);
            }
          } else if (afterBlockId === 'BOTTOM' || !afterBlockId) {
            root.append(node);
          } else {
            const targetBlock = children.find(
              child => child.getKey() === afterBlockId,
            );
            if (targetBlock) {
              targetBlock.insertAfter(node);
            } else {
              resolve({
                success: false,
                error: `Block ID ${afterBlockId} not found`,
              });
              return;
            }
          }

          resolve({ success: true, blockId: node.getKey() });
        } catch (error) {
          resolve({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });
    });
  }

  /**
   * Create a simple Lexical node from a block
   */
  private createSimpleNode(block: LexicalBlock) {
    const textContent = Array.isArray(block.source)
      ? block.source.join('\n')
      : block.source;

    const createTextNodes = () => {
      if (block.formatting && block.formatting.length > 0) {
        return block.formatting.map(seg => {
          const textNode = $createTextNode(seg.text);
          if (seg.format) {
            textNode.setFormat(seg.format);
          }
          return textNode;
        });
      } else {
        return [
          textContent ? $createTextNode(textContent) : $createTextNode(''),
        ];
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
        console.warn(
          `[LexicalAdapter] Unknown block type: ${block.block_type}`,
        );
        return null;
    }
  }
}
