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
import {
  $getRoot,
  $getSelection,
  $createParagraphNode,
  $createTextNode,
} from 'lexical';
import {
  $createHeadingNode,
  $createQuoteNode,
  type HeadingTagType,
} from '@lexical/rich-text';
import { $createCodeNode } from '@lexical/code';
import { $createListNode, $createListItemNode } from '@lexical/list';
import { $createHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import type { IOutput } from '@jupyterlab/nbformat';
import type {
  LexicalBlock,
  BlockFormat,
  BriefBlock,
} from '../tools/core/types';
import { editorStateToBlocks } from '../tools/utils/blocks';

/**
 * Result of a document operation
 */
export interface OperationResult {
  success: boolean;
  error?: string;
  blockId?: string; // For insert operations
  execution_count?: number | null; // For execution operations
  outputs?: any[]; // For execution operations
  elapsed_time?: number; // For execution operations
  message?: string; // For execution operations
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
  private _serviceManager?: any; // ServiceManager from @jupyterlab/services

  constructor(editor: LexicalEditor, serviceManager?: any) {
    this._editor = editor;
    this._serviceManager = serviceManager;
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
   * Get all blocks from the document.
   * Uses editorStateToBlocks which handles jupyter-input/output node merging.
   *
   * @param format - Response format: 'brief' (block_id + block_type only) or 'detailed' (full content)
   */
  async getBlocks(
    format: BlockFormat = 'brief',
  ): Promise<LexicalBlock[] | BriefBlock[]> {
    return new Promise(resolve => {
      const blocks = editorStateToBlocks(this._editor, format);
      resolve(blocks);
    });
  }

  /**
   * Get a specific block by index.
   * Uses editorStateToBlocks to ensure jupyter-input/output nodes are properly merged.
   * Always returns detailed format (single block operations need full content).
   */
  async getBlock(index: number): Promise<LexicalBlock | null> {
    return new Promise(resolve => {
      const blocks = editorStateToBlocks(this._editor, 'detailed');
      if (index >= 0 && index < blocks.length) {
        resolve(blocks[index] as LexicalBlock);
      } else {
        resolve(null);
      }
    });
  }

  /**
   * Get a block by ID.
   * Uses editorStateToBlocks to ensure jupyter-input/output nodes are properly merged.
   * Always returns detailed format (single block operations need full content).
   */
  async getBlockById(blockId: string): Promise<LexicalBlock | null> {
    return new Promise(resolve => {
      const blocks = editorStateToBlocks(this._editor, 'detailed');
      const block = (blocks as LexicalBlock[]).find(
        b => b.block_id === blockId,
      );
      resolve(block || null);
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
   * Run a specific block (jupyter-cell or jupyter-input).
   * If blockId is not provided, attempts to run the currently focused block.
   */
  async runBlock(blockId?: string): Promise<OperationResult> {
    // If no blockId provided, find the currently focused jupyter-cell
    if (!blockId) {
      let foundBlockId: string | null = null;

      this._editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!selection) return;

        const nodes = selection.getNodes();
        if (nodes.length === 0) return;

        const node = nodes[0];

        // Find parent jupyter-cell or jupyter-input
        let current: any = node;
        while (current) {
          const type = current.getType();
          if (type === 'jupyter-cell' || type === 'jupyter-input') {
            foundBlockId = current.getKey();
            break;
          }
          const parent = current.getParent();
          if (!parent) break;
          current = parent;
        }
      });

      if (!foundBlockId) {
        return {
          success: false,
          error: 'No jupyter cell is currently focused',
        };
      }

      blockId = foundBlockId;
    }

    const block = await this.getBlockById(blockId);
    if (!block) {
      return {
        success: false,
        error: `Block with ID ${blockId} not found`,
      };
    }

    // Accept both jupyter-cell (parent) and jupyter-input (child with actual code)
    const executableTypes = ['jupyter-cell', 'jupyter-input'];
    if (!executableTypes.includes(block.block_type)) {
      return {
        success: false,
        error: `Block type ${block.block_type} is not executable`,
      };
    }

    // Execute the block and collect results
    try {
      const startTime = Date.now();

      // Find the nodes and execute
      const result: any = await new Promise((resolve, reject) => {
        this._editor.update(() => {
          try {
            const root = $getRoot();
            let jupyterOutputNode: any = null;
            let code = '';

            // Find the jupyter-input and jupyter-output nodes
            const findNodes = (node: any) => {
              if (
                node.getType() === 'jupyter-cell' &&
                node.getKey() === blockId
              ) {
                // Found the jupyter-cell, get its children
                const children = node.getChildren();
                children.forEach((child: any) => {
                  if (child.getType() === 'jupyter-input') {
                    code = child.getTextContent();
                  } else if (child.getType() === 'jupyter-output') {
                    jupyterOutputNode = child;
                  }
                });
              } else if (
                node.getType() === 'jupyter-input' &&
                node.getKey() === blockId
              ) {
                code = node.getTextContent();
                // Find corresponding output node (sibling)
                const parent = node.getParent();
                if (parent) {
                  parent.getChildren().forEach((sibling: any) => {
                    if (sibling.getType() === 'jupyter-output') {
                      jupyterOutputNode = sibling;
                    }
                  });
                }
              }
            };

            // Search through document
            root.getChildren().forEach(findNodes);

            if (!jupyterOutputNode) {
              reject(
                new Error('Could not find jupyter-output node for execution'),
              );
              return;
            }

            if (!code || code.trim() === '') {
              reject(new Error('No code to execute'));
              return;
            }

            // Call executeCode() on the output node
            // This triggers execution and updates the UI
            jupyterOutputNode.executeCode(code);

            // Get the outputAdapter to await execution
            const outputAdapter = jupyterOutputNode.__outputAdapter;
            if (!outputAdapter) {
              reject(new Error('No outputAdapter available'));
              return;
            }

            resolve({ outputAdapter, code });
          } catch (error) {
            reject(error);
          }
        });
      });

      // Wait for execution to complete (outputAdapter.execute is async)
      // We need to wait a bit for the execution to finish and outputs to be collected
      await new Promise(r => setTimeout(r, 500));

      // Get the outputs from the outputAdapter
      const outputs = result.outputAdapter.outputArea.model.toJSON();
      const elapsed_time = (Date.now() - startTime) / 1000;

      const adapterResult = {
        success: true,
        execution_count: outputs.length > 0 ? 1 : null,
        outputs: outputs,
        elapsed_time,
        message: `Block executed in ${elapsed_time.toFixed(2)}s`,
      };

      return adapterResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to execute block: ${errorMessage}`,
      };
    }
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
   * Clear all outputs from all Jupyter cells in the lexical document.
   *
   * @remarks
   * Removes all execution outputs from all jupyter-cell blocks. This operation:
   * - Clears outputs but preserves cell source code
   * - Resets execution counts for jupyter cells
   * - Cannot be undone
   *
   * @returns Promise with operation result
   */
  async clearAllOutputs(): Promise<OperationResult> {
    return new Promise(resolve => {
      this._editor.update(() => {
        let clearedCount = 0;

        // Traverse document tree and clear all JupyterOutputNode outputs
        function clearJupyterOutputs(node: any) {
          // Check if node is a JupyterOutputNode by checking its type
          if (node.getType && node.getType() === 'jupyter-output') {
            // Use outputAdapter.clear() to properly clear the OutputArea model
            if (node.__outputAdapter) {
              node.__outputAdapter.clear();
              clearedCount++;
            }
          }
          // Traverse children if this is an element node
          if (node.getChildren) {
            const children = node.getChildren();
            for (const child of children) {
              clearJupyterOutputs(child);
            }
          }
        }

        const root = $getRoot();
        clearJupyterOutputs(root);

        resolve({
          success: true,
          message:
            clearedCount > 0
              ? `Cleared outputs from ${clearedCount} jupyter cells`
              : 'No jupyter cells found to clear',
        });
      });
    });
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

    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async resolve => {
      try {
        // Handle different block types that require command insertion
        if (block.block_type === 'equation') {
          // Import equation command dynamically
          const { INSERT_EQUATION_COMMAND } =
            await import('../plugins/EquationsPlugin');

          // Extract equation data from block
          const source = Array.isArray(block.source)
            ? block.source.join('\n')
            : block.source;

          const equation =
            (block.metadata?.equation as string) ||
            (block.metadata?.latex as string) ||
            source;

          // Equations are always display mode (inline: false), never inline
          const inline = false;

          // Create marker and dispatch equation insertion
          this._editor.update(() => {
            const root = $getRoot();
            const children = root.getChildren();

            // Create a temporary marker paragraph
            const marker = $createParagraphNode();
            marker.append($createTextNode('__EQUATION_MARKER__'));

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

          // Dispatch the equation command
          setTimeout(() => {
            this._editor.update(() => {
              // Find and select the marker
              const root = $getRoot();
              const children = root.getChildren();
              const markerNode = children.find(
                child =>
                  child.getType() === 'paragraph' &&
                  child.getTextContent() === '__EQUATION_MARKER__',
              );

              if (markerNode) {
                markerNode.selectEnd();
                markerNode.remove();
              }
            });

            // Dispatch the insert command
            this._editor.dispatchCommand(INSERT_EQUATION_COMMAND, {
              equation,
              inline,
            });

            resolve({ success: true });
          }, 10);
        } else if (block.block_type === 'jupyter-cell') {
          // Import jupyter command dynamically
          const { INSERT_JUPYTER_INPUT_OUTPUT_COMMAND } =
            await import('../plugins/JupyterInputOutputPlugin');

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
        } else {
          resolve({
            success: false,
            error: `Unsupported command-based block type: ${block.block_type}`,
          });
        }
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
        const listType = (block.metadata?.listType as string) || 'bullet';
        const list = $createListNode(listType as 'bullet' | 'number');

        // Parse source into individual list items (split by newlines)
        const items = textContent
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);

        // If no items provided, create one empty item
        if (items.length === 0) {
          const listItem = $createListItemNode();
          list.append(listItem);
        } else {
          // Create a list item for each line
          items.forEach(itemText => {
            const listItem = $createListItemNode();
            listItem.append($createTextNode(itemText));
            list.append(listItem);
          });
        }

        return list;
      }

      case 'horizontalrule': {
        return $createHorizontalRuleNode();
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
        return null;
    }
  }

  /**
   * Execute code directly in the kernel without creating a block.
   *
   * This method sends code execution requests directly to the kernel,
   * bypassing the lexical document model. Useful for:
   * - Variable inspection
   * - Environment setup
   * - Background tasks
   * - Tool introspection
   *
   * @param code - Code to execute (optional, defaults to empty string)
   * @param storeHistory - Whether to store execution in kernel history (defaults to true)
   * @param silent - Whether to suppress output (defaults to false)
   * @param stopOnError - Whether to stop execution on error (defaults to true)
   * @returns Promise with execution result including outputs
   */
  async executeCode(
    code?: string,
    storeHistory?: boolean,
    silent?: boolean,
    stopOnError?: boolean,
  ): Promise<{
    success: boolean;
    outputs?: Array<{
      type: 'stream' | 'execute_result' | 'display_data' | 'error';
      content: unknown;
    }>;
    executionCount?: number;
    error?: string;
  }> {
    // Handle empty/undefined code with default
    const codeToExecute = code || '';

    if (!codeToExecute.trim()) {
      return {
        success: false,
        error: 'Code parameter is required and cannot be empty',
      };
    }

    if (!this._serviceManager) {
      return {
        success: false,
        error:
          'No ServiceManager available. LexicalAdapter requires a ServiceManager to execute code.',
      };
    }

    // Get a running kernel connection from serviceManager
    let kernel: any = null;

    try {
      // Refresh the list of running kernels
      await this._serviceManager.kernels.refreshRunning();
      const runningKernels = Array.from(
        this._serviceManager.kernels.running(),
      ) as any[];

      if (runningKernels.length === 0) {
        return {
          success: false,
          error: 'No active kernel found. Please start a kernel first.',
        };
      }

      // Get the first running kernel model
      const kernelModel: any = runningKernels[0];

      // IMPORTANT: await the connectTo call to get the actual kernel connection
      kernel = await this._serviceManager.kernels.connectTo({
        model: kernelModel,
      });
    } catch (err) {
      return {
        success: false,
        error: `Failed to connect to kernel: ${err instanceof Error ? err.message : String(err)}`,
      };
    }

    if (!kernel || typeof kernel.requestExecute !== 'function') {
      return {
        success: false,
        error: 'Kernel connection does not have requestExecute method.',
      };
    }

    try {
      // Apply defaults in adapter layer
      const future = kernel.requestExecute({
        code: codeToExecute,
        stop_on_error: stopOnError ?? true,
        store_history: storeHistory ?? true,
        silent: silent ?? false,
        allow_stdin: false,
      });

      const outputs: Array<{
        type: 'stream' | 'execute_result' | 'display_data' | 'error';
        content: unknown;
      }> = [];

      let executionCount: number | undefined;

      // Collect outputs
      future.onIOPub = (msg: any) => {
        const msgType = msg.header.msg_type;

        if (msgType === 'stream') {
          outputs.push({
            type: 'stream',
            content: msg.content,
          });
        } else if (msgType === 'execute_result') {
          outputs.push({
            type: 'execute_result',
            content: msg.content,
          });
          executionCount = (msg.content as any).execution_count;
        } else if (msgType === 'display_data') {
          outputs.push({
            type: 'display_data',
            content: msg.content,
          });
        } else if (msgType === 'error') {
          outputs.push({
            type: 'error',
            content: msg.content,
          });
        }
      };

      // Wait for execution to complete
      await future.done;

      return {
        success: true,
        outputs,
        executionCount,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
