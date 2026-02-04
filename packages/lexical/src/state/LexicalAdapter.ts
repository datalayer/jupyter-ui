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

import type { LexicalEditor, LexicalNode } from 'lexical';
import {
  $getRoot,
  $getSelection,
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
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
import {
  editorStateToBlocks,
  parseMarkdownFormatting,
} from '../tools/utils/blocks';
import { INPUT_UUID_TO_OUTPUT_KEY } from '../plugins/JupyterInputOutputPlugin';

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
  private _runAllAbortController: AbortController | null = null;

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
   * Get the service manager instance.
   * Provides access to kernel connections for monitoring and operations.
   */
  get serviceManager(): any {
    return this._serviceManager;
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
    // STEP 0: Check if source contains block-level markdown
    // IMPORTANT: Skip markdown parsing for block types that are NOT prose
    // (jupyter-cell, code, etc. contain # characters that aren't markdown headings)
    const sourceText = Array.isArray(block.source)
      ? block.source.join('\n')
      : block.source;

    const shouldParseMarkdown =
      block.block_type === 'paragraph' || block.block_type === 'text';

    if (shouldParseMarkdown && this.containsBlockLevelMarkdown(sourceText)) {
      // Parse into multiple blocks
      const parsedBlocks = this.parseMarkdownToBlocks(sourceText);

      if (parsedBlocks.length > 1) {
        // Insert each block sequentially
        let currentAfterBlockId = afterBlockId;
        let lastBlockId: string | undefined;

        for (const parsedBlock of parsedBlocks) {
          // Preserve original block's metadata (e.g., collapsible)
          parsedBlock.metadata = {
            ...parsedBlock.metadata,
            ...block.metadata,
          };

          // Insert block
          const result = await this.insertBlock(
            parsedBlock,
            currentAfterBlockId,
          );

          if (!result.success) {
            return result; // Return first error
          }

          // Chain insertions: next block goes after this one
          if (result.blockId) {
            lastBlockId = result.blockId;
            currentAfterBlockId = result.blockId;
          }
        }

        return {
          success: true,
          blockId: lastBlockId,
          message: `Inserted ${parsedBlocks.length} blocks from markdown`,
        };
      }
    }

    // Special case: block belongs inside a collapsible
    if (block.metadata?.collapsible) {
      const collapsibleId = block.metadata.collapsible as string;

      // Detect common mistake: using position markers as collapsible IDs
      if (collapsibleId === 'TOP' || collapsibleId === 'BOTTOM') {
        return Promise.resolve({
          success: false,
          error:
            `Invalid collapsible ID: "${collapsibleId}". ` +
            `To insert blocks inside a collapsible: ` +
            `1) First insert the collapsible container (returns blockId), ` +
            `2) Then insert nested blocks with properties.collapsible set to that blockId. ` +
            `Use afterId for positioning (TOP/BOTTOM/blockId), not properties.collapsible.`,
        });
      }

      return new Promise(resolve => {
        this._editor.update(() => {
          const root = $getRoot();
          const children = root.getChildren();

          // Find the collapsible container
          const collapsible = children.find(c => c.getKey() === collapsibleId);

          if (
            !collapsible ||
            collapsible.getType() !== 'collapsible-container'
          ) {
            resolve({
              success: false,
              error: `Collapsible container ${collapsibleId} not found`,
            });
            return;
          }

          // Find the collapsible-content node
          const containerChildren = (collapsible as any).getChildren?.() || [];
          const contentNode = containerChildren.find(
            (c: any) => c.getType() === 'collapsible-content',
          );

          if (!contentNode) {
            resolve({
              success: false,
              error: `Collapsible content node not found in ${collapsibleId}`,
            });
            return;
          }

          // Strategy: Insert the block normally (at root level), then move it into the collapsible-content
          // This works for both simple and complex block types

          // Remove collapsible from metadata to avoid recursion
          const blockForInsertion: LexicalBlock = {
            ...block,
            metadata: { ...block.metadata, collapsible: undefined },
          };

          // Insert at root level using normal insertion logic
          this.insertBlock(blockForInsertion, 'BOTTOM')
            .then(result => {
              if (!result.success || !result.blockId) {
                resolve({
                  success: false,
                  error: `Failed to insert ${block.block_type}: ${result.error || 'Unknown error'}`,
                });
                return;
              }

              // Now move the inserted node into the collapsible-content
              setTimeout(() => {
                this._editor.update(() => {
                  const root = $getRoot();
                  const children = root.getChildren();

                  // Find the node we just inserted
                  const insertedNode = children.find(
                    c => c.getKey() === result.blockId,
                  );

                  if (!insertedNode) {
                    resolve({
                      success: false,
                      error: `Could not find inserted node ${result.blockId}`,
                    });
                    return;
                  }

                  // Remove from root
                  insertedNode.remove();

                  // Append to collapsible content
                  contentNode.append(insertedNode);

                  resolve({
                    success: true,
                    blockId: result.blockId,
                    message: `Block of type '${block.block_type}' inserted inside collapsible ${collapsibleId}`,
                  });
                });
              }, 50); // Wait a bit longer to ensure command-based insertions complete
            })
            .catch(error => {
              resolve({
                success: false,
                error: `Failed to insert block: ${error.message || String(error)}`,
              });
            });
        });
      });
    }

    // Handle special block types that require commands
    if (this.requiresCommand(block.block_type)) {
      return this.insertViaCommand(block, afterBlockId);
    }

    // Handle simple block types via direct node creation
    return this.insertViaNode(block, afterBlockId);
  }

  /**
   * Delete multiple blocks by their IDs.
   * Handles complex logic including validation, sorting, and cascading deletions.
   *
   * @param blockIds - Array of block IDs to delete
   * @returns Promise with operation result including deleted blocks info
   */
  async deleteBlock(
    blockIds: string[],
  ): Promise<OperationResult & { deletedBlocks?: Array<{ id: string }> }> {
    try {
      // Read all blocks to validate IDs exist and get positions
      const blocks = await this.getBlocks('detailed');
      const blockIdSet = new Set(blocks.map(block => block.block_id));

      // Validate ALL IDs exist
      const missingIds: string[] = [];
      for (const id of blockIds) {
        if (!blockIdSet.has(id)) {
          missingIds.push(id);
        }
      }

      if (missingIds.length > 0) {
        return {
          success: false,
          error: `Block ID(s) not found: ${missingIds.join(', ')}. Document has ${blocks.length} blocks.`,
        };
      }

      // Sort IDs in reverse order to delete children before parents (collapsibles last)
      // This prevents cascading deletions from causing "block not found" errors
      const sortedIds = [...blockIds].sort((a, b) => {
        const indexA = blocks.findIndex(block => block.block_id === a);
        const indexB = blocks.findIndex(block => block.block_id === b);
        // Sort in reverse order (higher index first)
        return indexB - indexA;
      });

      const deletedBlocks: Array<{ id: string }> = [];

      // Delete each block in reverse order
      for (const blockId of sortedIds) {
        const result = await this._deleteSingleBlock(blockId);

        if (result.success) {
          deletedBlocks.push({ id: blockId });
        } else if (result.error?.includes('not found')) {
          // Block was already deleted by cascading deletion (parent collapsible removed)
          // This is expected behavior, skip and continue
          continue;
        } else {
          // Other errors should propagate
          return result;
        }
      }

      return {
        success: true,
        deletedBlocks,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Delete a single block by ID (internal helper).
   */
  private async _deleteSingleBlock(blockId: string): Promise<OperationResult> {
    return new Promise(resolve => {
      this._editor.update(() => {
        try {
          const root = $getRoot();

          // Helper function to recursively search for node by key
          const findNodeByKey = (node: any, targetKey: string): any => {
            if (node.getKey() === targetKey) {
              return node;
            }

            // Check children if the node has them
            if ('getChildren' in node) {
              const children = node.getChildren();
              for (const child of children) {
                const found = findNodeByKey(child, targetKey);
                if (found) return found;
              }
            }

            return null;
          };

          // Search for the node recursively
          const node = findNodeByKey(root, blockId);

          if (!node) {
            resolve({
              success: false,
              error: `Block with ID ${blockId} not found`,
            });
            return;
          }

          const nodeType = node.getType();
          const parent = node.getParent();

          // For equation and excalidraw nodes, always remove the parent paragraph wrapper
          // These are always wrapped in paragraphs by their respective plugins
          if (
            (nodeType === 'equation' || nodeType === 'excalidraw') &&
            parent &&
            parent.getType() === 'paragraph'
          ) {
            // Remove the paragraph wrapper
            parent.remove();
          } else {
            // Normal node - remove it directly
            node.remove();
          }

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
    const deleteResult = await this.deleteBlock([blockId]);
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

            // Find the jupyter-input and jupyter-output nodes (recursively)
            const findNodes = (node: any): boolean => {
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
                return true; // Found it
              } else if (
                node.getType() === 'jupyter-input' &&
                node.getKey() === blockId
              ) {
                code = node.getTextContent();
                // Find corresponding output node using UUID map (prevents output mixing!)
                const inputUuid = node.getJupyterInputNodeUuid();
                const outputKey = INPUT_UUID_TO_OUTPUT_KEY.get(inputUuid);
                if (outputKey) {
                  jupyterOutputNode = $getNodeByKey(outputKey);
                }
                return true; // Found it
              }

              // Recursively search children (for collapsibles and other containers)
              const children = node.getChildren?.() || [];
              for (const child of children) {
                if (findNodes(child)) {
                  return true; // Found in descendant
                }
              }

              return false; // Not found
            };

            // Search through document recursively
            for (const child of root.getChildren()) {
              if (findNodes(child)) {
                break; // Stop after finding the target
              }
            }

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
    // Abort any existing run-all operation
    if (this._runAllAbortController) {
      this._runAllAbortController.abort();
    }

    // Create new abort controller for this run
    this._runAllAbortController = new AbortController();
    const signal = this._runAllAbortController.signal;

    try {
      const blocks = await this.getBlocks();
      const executableBlocks = blocks.filter(
        b => b.block_type === 'jupyter-cell',
      );

      for (const block of executableBlocks) {
        // Check if aborted before running next block
        if (signal.aborted) {
          return {
            success: false,
            error: 'Run all blocks was cancelled (new run all started)',
          };
        }

        const result = await this.runBlock(block.block_id);
        if (!result.success) {
          console.error(
            `[LexicalAdapter] Block ${block.block_id} failed:`,
            result.error,
          );
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
    } finally {
      // Clean up controller if this is still the active one
      if (this._runAllAbortController?.signal === signal) {
        this._runAllAbortController = null;
      }
    }
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
   * Restart the Jupyter kernel.
   * Dispatches the RESTART_JUPYTER_KERNEL_COMMAND which is handled by JupyterInputOutputPlugin.
   */
  async restartKernel(): Promise<OperationResult> {
    return new Promise(resolve => {
      // Import command dynamically to avoid circular dependencies
      import('../plugins/JupyterInputOutputPlugin')
        .then(module => {
          const { RESTART_JUPYTER_KERNEL_COMMAND } = module;

          // Dispatch the restart command
          const handled = this._editor.dispatchCommand(
            RESTART_JUPYTER_KERNEL_COMMAND,
            undefined,
          );

          if (handled) {
            resolve({
              success: true,
              message: 'Kernel restart initiated',
            });
          } else {
            resolve({
              success: false,
              error: 'RESTART_JUPYTER_KERNEL_COMMAND was not handled',
            });
          }
        })
        .catch(error => {
          resolve({
            success: false,
            error: `Failed to load restart command: ${error.message}`,
          });
        });
    });
  }

  /**
   * Check if a block type requires command-based insertion
   */
  private requiresCommand(blockType: string): boolean {
    return [
      'jupyter-cell',
      'image',
      'equation',
      'youtube',
      'excalidraw',
      'table',
      'collapsible',
    ].includes(blockType);
  }

  /**
   * Insert a block using editor commands (for complex types)
   */
  private async insertViaCommand(
    block: LexicalBlock,
    afterBlockId: string,
  ): Promise<OperationResult> {
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

            // Find the newly inserted equation node and get its ID
            let blockId: string | undefined;
            setTimeout(() => {
              this._editor.getEditorState().read(() => {
                const root = $getRoot();
                const children = root.getChildren();

                // Find newest equation node
                for (let i = children.length - 1; i >= 0; i--) {
                  if (children[i].getType() === 'equation') {
                    blockId = children[i].getKey();
                    break;
                  }
                }
              });

              resolve({ success: true, blockId });
            }, 20);
          }, 10);
        } else if (block.block_type === 'jupyter-cell') {
          // Import jupyter command dynamically
          const { INSERT_JUPYTER_INPUT_OUTPUT_COMMAND } =
            await import('../plugins/JupyterInputOutputPlugin');

          const source = Array.isArray(block.source)
            ? block.source.join('\n')
            : block.source;

          const commandPayload = {
            code: source,
            outputs: (block.metadata?.outputs || []) as IOutput[],
            loading: '',
          };

          // NO MARKERS - directly set selection and dispatch
          let blockId: string | undefined;

          this._editor.update(() => {
            const root = $getRoot();
            const children = root.getChildren();

            // Set selection at target position
            if (afterBlockId === 'TOP') {
              if (children.length > 0) {
                children[0].selectStart();
              } else {
                root.selectStart();
              }
            } else if (afterBlockId === 'BOTTOM' || !afterBlockId) {
              root.selectEnd();
            } else {
              const targetBlock = children.find(
                child => child.getKey() === afterBlockId,
              );
              if (targetBlock) {
                targetBlock.selectEnd();
              } else {
                throw new Error(`Block ID ${afterBlockId} not found`);
              }
            }

            // Dispatch command with selection already set
            this._editor.dispatchCommand(
              INSERT_JUPYTER_INPUT_OUTPUT_COMMAND,
              commandPayload,
            );

            // Find the newly created node immediately (same update)
            const newChildren = $getRoot().getChildren();

            for (let i = newChildren.length - 1; i >= 0; i--) {
              if (newChildren[i].getType() === 'jupyter-input') {
                blockId = newChildren[i].getKey();
                break;
              }
            }
          });

          if (!blockId) {
            resolve({
              success: false,
              error: 'Failed to create jupyter-cell',
            });
            return;
          }

          resolve({ success: true, blockId });
        } else if (block.block_type === 'youtube') {
          // Import YouTube command dynamically
          const { INSERT_YOUTUBE_COMMAND } =
            await import('../plugins/YouTubePlugin');
          // Get videoID from source field (11-character YouTube video ID or full URL)
          const sourceText = Array.isArray(block.source)
            ? block.source.join('\n')
            : block.source;

          // Extract video ID from various YouTube URL formats
          const extractVideoID = (input: string): string => {
            const trimmed = input.trim();

            // If it's already just an ID (11 chars, alphanumeric + - and _)
            if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
              return trimmed;
            }

            // Extract from various URL formats:
            // - https://www.youtube.com/watch?v=VIDEO_ID
            // - https://youtu.be/VIDEO_ID
            // - https://youtube.com/watch?v=VIDEO_ID
            // - https://m.youtube.com/watch?v=VIDEO_ID

            // Try youtu.be format first
            const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
            if (shortMatch) {
              return shortMatch[1];
            }

            // Try youtube.com/watch?v= format
            const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
            if (watchMatch) {
              return watchMatch[1];
            }

            // Fallback to default if no valid ID found
            return 'lO2p9LQB7ds';
          };

          const videoID = extractVideoID(sourceText || '');

          // Insert using marker technique
          await this.insertWithMarker(afterBlockId, () => {
            this._editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, videoID);
          });

          // Find the newly inserted YouTube node and get its ID
          let blockId: string | undefined;
          setTimeout(() => {
            this._editor.getEditorState().read(() => {
              const root = $getRoot();
              const children = root.getChildren();

              // Find newest youtube node
              for (let i = children.length - 1; i >= 0; i--) {
                if (children[i].getType() === 'youtube') {
                  blockId = children[i].getKey();
                  break;
                }
              }
            });

            resolve({ success: true, blockId });
          }, 20);
        } else if (block.block_type === 'excalidraw') {
          // Import Excalidraw node dynamically
          const { $createExcalidrawNode } =
            await import('../nodes/ExcalidrawNode');
          const { $wrapNodeInElement } = await import('@lexical/utils');
          const { $isRootOrShadowRoot } = await import('lexical');

          const data = (block.metadata?.data as string) || '[]';
          const width = block.metadata?.width as number | undefined;
          const height = block.metadata?.height as number | undefined;

          let blockId: string | undefined;

          this._editor.update(() => {
            const node = $createExcalidrawNode(
              data,
              width || 'inherit',
              height || 'inherit',
            );
            this.insertNodeAtPosition(node, afterBlockId);

            // Capture block ID
            blockId = node.getKey();

            // Wrap in paragraph if at root
            if ($isRootOrShadowRoot(node.getParentOrThrow())) {
              $wrapNodeInElement(node, $createParagraphNode).selectEnd();
            }
          });

          resolve({ success: true, blockId });
        } else if (block.block_type === 'table') {
          // Import table command dynamically
          const { INSERT_TABLE_COMMAND } = await import('@lexical/table');
          const {
            $getTableCellNodeFromLexicalNode,
            $getTableNodeFromLexicalNodeOrThrow,
          } = await import('@lexical/table');

          // Parse table data from source if provided as markdown
          let rows = (block.metadata?.rows as number) || 2;
          let columns = (block.metadata?.columns as number) || 2;
          let data = block.metadata?.data as string[][] | undefined;
          const includeHeaders = block.metadata?.includeHeaders !== false;

          // CRITICAL: If data is provided directly in metadata, infer dimensions from it
          if (data && Array.isArray(data) && data.length > 0) {
            rows = data.length;
            columns = data[0].length;
          }

          // If source contains markdown table, parse it
          const sourceText = Array.isArray(block.source)
            ? block.source.join('\n')
            : block.source;

          if (
            sourceText &&
            typeof sourceText === 'string' &&
            sourceText.includes('|')
          ) {
            try {
              // Parse markdown table
              const lines = sourceText.split('\n').filter(line => line.trim());
              const tableData: string[][] = [];

              for (const line of lines) {
                // Skip separator rows like |---|---|
                if (line.match(/^\|?[\s-|]+\|?$/)) {
                  continue;
                }

                // Extract cell values
                const cells = line
                  .split('|')
                  .slice(1, -1) // Remove empty strings from start/end
                  .map(cell => cell.trim());

                if (cells.length > 0) {
                  tableData.push(cells);
                }
              }

              if (tableData.length > 0) {
                data = tableData;
                rows = tableData.length;
                columns = tableData[0].length;
              }
            } catch (e) {
              // If parsing fails, use defaults
            }
          }

          await this.insertWithMarker(afterBlockId, () => {
            this._editor.dispatchCommand(INSERT_TABLE_COMMAND, {
              rows: rows.toString(),
              columns: columns.toString(),
              includeHeaders,
            });
          });

          // Find the newly inserted table node and get its ID
          let blockId: string | undefined;
          setTimeout(() => {
            this._editor.update(() => {
              const root = $getRoot();
              const children = root.getChildren();

              // Find the newest table
              for (let i = children.length - 1; i >= 0; i--) {
                if (children[i].getType() === 'table') {
                  // Capture block ID
                  blockId = children[i].getKey();

                  // Populate table cells with data if provided
                  if (data && data.length > 0) {
                    try {
                      const tableNode = $getTableNodeFromLexicalNodeOrThrow(
                        children[i],
                      );
                      const tableRows = (tableNode as any).getChildren();

                      // Populate each cell with data
                      for (
                        let rowIdx = 0;
                        rowIdx < Math.min(data.length, tableRows.length);
                        rowIdx++
                      ) {
                        const rowNode = tableRows[rowIdx];
                        const cellNodes = (rowNode as any).getChildren();

                        for (
                          let colIdx = 0;
                          colIdx <
                          Math.min(data[rowIdx].length, cellNodes.length);
                          colIdx++
                        ) {
                          const cellNode = $getTableCellNodeFromLexicalNode(
                            cellNodes[colIdx],
                          );
                          if (cellNode) {
                            // Clear existing content and add new text
                            cellNode.clear();
                            cellNode.append(
                              $createTextNode(data[rowIdx][colIdx]),
                            );
                          }
                        }
                      }
                    } catch (error) {
                      // Silently fail if table population doesn't work
                    }
                  }
                  break;
                }
              }
            });

            resolve({ success: true, blockId });
          }, 20);
        } else if (block.block_type === 'collapsible') {
          // Import collapsible command dynamically
          const { INSERT_COLLAPSIBLE_COMMAND } =
            await import('../plugins/CollapsiblePlugin');
          const open = (block.metadata?.open as boolean) ?? true;

          // Title comes from source field
          const title = Array.isArray(block.source)
            ? block.source.join('\n')
            : block.source || '';

          // Insert empty collapsible structure
          await this.insertWithMarker(afterBlockId, () => {
            this._editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined);
          });

          // Find the newly inserted collapsible node and get its ID
          let blockId: string | undefined;
          setTimeout(() => {
            this._editor.update(() => {
              const root = $getRoot();
              const children = root.getChildren();

              // Find newest collapsible
              for (let i = children.length - 1; i >= 0; i--) {
                if (children[i].getType() === 'collapsible-container') {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const container = children[i] as any;

                  // Capture block ID
                  blockId = container.getKey();

                  // Set open state
                  container.setOpen?.(open);

                  // Populate title
                  const containerChildren = container.getChildren();
                  if (containerChildren[0] && title) {
                    containerChildren[0].clear();
                    containerChildren[0].append($createTextNode(title));
                  }
                  // Note: content is empty - blocks will be inserted separately with metadata.collapsible
                  break;
                }
              }
            });

            resolve({ success: true, blockId });
          }, 20);
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
        // Parse markdown formatting from text content
        const segments = parseMarkdownFormatting(textContent || '');
        return segments.map(seg => {
          const textNode = $createTextNode(seg.text);
          if (seg.format) {
            textNode.setFormat(seg.format);
          }
          return textNode;
        });
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
          // Create a list item for each line with inline markdown parsing
          items.forEach(itemText => {
            const listItem = $createListItemNode();
            const segments = parseMarkdownFormatting(itemText);
            segments.forEach(seg => {
              const textNode = $createTextNode(seg.text);
              if (seg.format) {
                textNode.setFormat(seg.format);
              }
              listItem.append(textNode);
            });
            list.append(listItem);
          });
        }

        return list;
      }

      case 'horizontalrule': {
        return $createHorizontalRuleNode() as unknown as LexicalNode;
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
   * Check if text contains block-level markdown that should be split into multiple blocks
   */
  private containsBlockLevelMarkdown(text: string): boolean {
    if (!text || typeof text !== 'string') return false;

    // Check for headings
    if (/^#{1,6}\s+.+$/m.test(text)) return true;

    // Check for lists (bullet or numbered)
    if (/^[\s]*[-*+]\s+.+$/m.test(text)) return true;
    if (/^[\s]*\d+\.\s+.+$/m.test(text)) return true;

    // Check for multiple paragraphs (separated by blank lines)
    if (/\n\s*\n/.test(text)) return true;

    return false;
  }

  /**
   * Parse markdown text into multiple LexicalBlock objects
   */
  private parseMarkdownToBlocks(text: string): LexicalBlock[] {
    const blocks: LexicalBlock[] = [];
    const lines = text.split('\n');

    let currentBlock: {
      type: string;
      lines: string[];
      metadata?: Record<string, unknown>;
    } | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Empty line - finish current block
      if (trimmed === '') {
        if (currentBlock && currentBlock.lines.length > 0) {
          blocks.push(this.createBlockFromParsed(currentBlock));
          currentBlock = null;
        }
        continue;
      }

      // Heading (# through ######)
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        // Finish previous block
        if (currentBlock && currentBlock.lines.length > 0) {
          blocks.push(this.createBlockFromParsed(currentBlock));
        }

        // Create heading block
        const level = headingMatch[1].length;
        blocks.push({
          block_id: '', // Will be assigned on insertion
          block_type: 'heading',
          source: headingMatch[2],
          metadata: { tag: `h${level}` },
        });
        currentBlock = null;
        continue;
      }

      // Bullet list item (-, *, +)
      const bulletMatch = trimmed.match(/^[-*+]\s+(.+)$/);
      if (bulletMatch) {
        // Start or continue list
        if (!currentBlock || currentBlock.type !== 'list-bullet') {
          if (currentBlock && currentBlock.lines.length > 0) {
            blocks.push(this.createBlockFromParsed(currentBlock));
          }
          currentBlock = {
            type: 'list-bullet',
            lines: [bulletMatch[1]],
            metadata: { listType: 'bullet' },
          };
        } else {
          currentBlock.lines.push(bulletMatch[1]);
        }
        continue;
      }

      // Numbered list item (1., 2., etc.)
      const numberedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
      if (numberedMatch) {
        // Start or continue numbered list
        if (!currentBlock || currentBlock.type !== 'list-number') {
          if (currentBlock && currentBlock.lines.length > 0) {
            blocks.push(this.createBlockFromParsed(currentBlock));
          }
          currentBlock = {
            type: 'list-number',
            lines: [numberedMatch[1]],
            metadata: { listType: 'number' },
          };
        } else {
          currentBlock.lines.push(numberedMatch[1]);
        }
        continue;
      }

      // Regular paragraph text
      if (!currentBlock || currentBlock.type.startsWith('list-')) {
        // Lists don't continue across non-list lines
        if (currentBlock && currentBlock.lines.length > 0) {
          blocks.push(this.createBlockFromParsed(currentBlock));
        }
        currentBlock = { type: 'paragraph', lines: [line] };
      } else {
        // Continue current paragraph
        currentBlock.lines.push(line);
      }
    }

    // Finish last block
    if (currentBlock && currentBlock.lines.length > 0) {
      blocks.push(this.createBlockFromParsed(currentBlock));
    }

    return blocks;
  }

  /**
   * Create a LexicalBlock from parsed markdown
   */
  private createBlockFromParsed(parsed: {
    type: string;
    lines: string[];
    metadata?: Record<string, unknown>;
  }): LexicalBlock {
    if (parsed.type === 'list-bullet' || parsed.type === 'list-number') {
      return {
        block_id: '',
        block_type: 'list',
        source: parsed.lines.join('\n'),
        metadata: parsed.metadata || {},
      };
    }

    return {
      block_id: '',
      block_type: parsed.type,
      source: parsed.lines.join('\n'),
      metadata: parsed.metadata || {},
    };
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

  /**
   * Insert a block using marker technique (for command-based insertion).
   * This ensures correct positioning when commands don't support afterId.
   */
  private async insertWithMarker(
    afterBlockId: string | undefined,
    dispatchFn: () => void,
  ): Promise<void> {
    return new Promise(resolve => {
      this._editor.update(() => {
        const root = $getRoot();
        const children = root.getChildren();

        const marker = $createParagraphNode();
        marker.append($createTextNode('__MARKER__'));

        if (afterBlockId === 'TOP') {
          if (children.length > 0) {
            children[0].insertBefore(marker);
          } else {
            root.append(marker);
          }
        } else if (afterBlockId === 'BOTTOM' || !afterBlockId) {
          root.append(marker);
        } else {
          const target = children.find(c => c.getKey() === afterBlockId);
          if (target) {
            target.insertAfter(marker);
          } else {
            throw new Error(`Block ${afterBlockId} not found`);
          }
        }
      });

      setTimeout(() => {
        this._editor.update(() => {
          const root = $getRoot();
          const marker = root
            .getChildren()
            .find(
              c =>
                c.getType() === 'paragraph' &&
                c.getTextContent() === '__MARKER__',
            );
          if (marker) {
            marker.selectEnd();
            marker.remove();
          }
        });

        dispatchFn();
        resolve();
      }, 10);
    });
  }

  /**
   * Insert a node at a specific position (for direct node insertion).
   */
  private insertNodeAtPosition(
    node: LexicalNode,
    afterBlockId: string | undefined,
  ): void {
    const root = $getRoot();
    const children = root.getChildren();

    if (afterBlockId === 'TOP') {
      if (children.length > 0) {
        children[0].insertBefore(node);
      } else {
        root.append(node);
      }
    } else if (afterBlockId === 'BOTTOM' || !afterBlockId) {
      root.append(node);
    } else {
      const target = children.find(c => c.getKey() === afterBlockId);
      if (target) {
        target.insertAfter(node);
      } else {
        throw new Error(`Block ${afterBlockId} not found`);
      }
    }
  }

  /**
   * List available block types with their schemas.
   * This operation returns static block type definitions and doesn't require editor access.
   *
   * @param category - Optional category filter
   * @returns Promise with available block types, count, and categories
   */
  async listAvailableBlocks(): Promise<{
    success: boolean;
    types?: any[];
    count?: number;
    error?: string;
  }> {
    try {
      // Import and execute the operation
      const { listAvailableBlocksOperation } =
        await import('../tools/operations/listAvailableBlocks');

      const result = await listAvailableBlocksOperation.execute(
        { type: 'all' },
        {
          documentId: 'static-operation', // Not used for this operation
          executor: null as any, // Not used for this operation
        },
      );

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
