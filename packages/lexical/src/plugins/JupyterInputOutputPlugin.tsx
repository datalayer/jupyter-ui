/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useCallback, useRef } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  createCommand,
  NodeKey,
  COMMAND_PRIORITY_EDITOR,
  INSERT_LINE_BREAK_COMMAND,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_CRITICAL,
  KEY_ENTER_COMMAND,
  COMMAND_PRIORITY_LOW,
  $createLineBreakNode,
  $createRangeSelection,
  LexicalNode,
  $getNodeByKey,
  $createNodeSelection,
  $setSelection,
  SELECT_ALL_COMMAND,
  $getRoot,
  $isElementNode,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  OutputAdapter,
  newUuid,
  Kernel,
  OnSessionConnection,
} from '@datalayer/jupyter-react';
import { UUID } from '@lumino/coreutils';
import { IOutput } from '@jupyterlab/nbformat';
import type { IOutputAreaModel } from '@jupyterlab/outputarea';
import { Session } from '@jupyterlab/services';
import { createNoKernelWarning } from '../nodes/jupyterUtils';
import {
  $createJupyterInputNode,
  JupyterInputNode,
  $isJupyterInputNode,
} from '../nodes/JupyterInputNode';
import { registerCodeHighlighting } from '../nodes/JupyterInputHighlighter';
import {
  JupyterOutputNode,
  $createJupyterOutputNode,
} from '../nodes/JupyterOutputNode';

type UUID = string;

export const INPUT_UUID_TO_OUTPUT_KEY = new Map<UUID, NodeKey | undefined>();
export const INPUT_UUID_TO_CODE_KEY = new Map<UUID, NodeKey | undefined>();
export const INPUT_UUID_TO_OUTPUT_UUID = new Map<UUID, UUID | undefined>();
export const OUTPUT_UUID_TO_CODE_UUID = new Map<UUID, UUID | undefined>();
export const OUTPUT_UUID_TO_OUTPUT_KEY = new Map<UUID, NodeKey | undefined>();

export const DEFAULT_INITIAL_OUTPUTS: IOutput[] = [
  {
    output_type: 'execute_result',
    data: {
      'text/html': [
        '<div style="color: #888; font-size: 11px; font-style: italic; padding: 0; margin: 0;">',
        'Press <kbd style="font-size: 10px; padding: 1px 4px; background: #f0f0f0; border: 1px solid #ccc; border-radius: 3px;">Shift+Enter</kbd> to execute. Please connect to execute code.',
        '</div>',
      ],
    },
    execution_count: 0,
    metadata: {},
  },
];

export type JupyterInputOutputProps = {
  code: string;
  outputs?: IOutput[];
  loading?: string;
};

export type JupyterInputOutputPluginProps = {
  kernel?: Kernel;
  /**
   * Callback on session connection changed.
   */
  onSessionConnection?: OnSessionConnection;
};

export const INSERT_JUPYTER_INPUT_OUTPUT_COMMAND =
  createCommand<JupyterInputOutputProps>();

/**
 * Command to execute the currently focused/selected Jupyter cell.
 * Dispatching this command will execute the code in the cell where the cursor is located.
 */
export const RUN_JUPYTER_CELL_COMMAND = createCommand<void>();

/**
 * Command to execute all Jupyter cells in the document.
 * Dispatching this command will execute all cells in sequential order.
 */
export const RUN_ALL_JUPYTER_CELLS_COMMAND = createCommand<void>();

/**
 * Command to restart the Jupyter kernel.
 * Dispatching this command will restart the kernel session.
 */
export const RESTART_JUPYTER_KERNEL_COMMAND = createCommand<void>();

/**
 * Command to clear all outputs from all Jupyter cells in the document.
 * Dispatching this command will clear the outputs of all cells without affecting the code.
 */
export const CLEAR_ALL_OUTPUTS_COMMAND = createCommand<void>();

export const JupyterInputOutputPlugin = (
  props?: JupyterInputOutputPluginProps,
) => {
  const { kernel, onSessionConnection } = props || {};
  const [editor] = useLexicalComposerContext();
  const isUpdatingKernels = useRef(false);
  const isMovingNodes = useRef(false);

  // Function to update all existing output nodes with the current kernel
  const updateAllOutputNodesWithKernel = useCallback(() => {
    if (!kernel || isUpdatingKernels.current) return;

    isUpdatingKernels.current = true;
    editor.update(
      () => {
        editor.getEditorState()._nodeMap.forEach(node => {
          if (node instanceof JupyterOutputNode) {
            // Update the kernel for this output node
            node.updateKernel(kernel);
          }
        });
      },
      { discrete: true },
    ); // Use discrete to prevent triggering update listeners
    isUpdatingKernels.current = false;
  }, [kernel, editor]);

  // Update output nodes when kernel becomes available
  useEffect(() => {
    if (kernel) {
      updateAllOutputNodesWithKernel();
    }
  }, [kernel, updateAllOutputNodesWithKernel]);

  // Restore mutation listeners with proper recursion protection
  useEffect(() => {
    return editor.registerMutationListener(
      JupyterInputNode,
      (mutatedNodes: Map<NodeKey, any>) => {
        // Skip if we're already moving nodes to prevent recursion
        if (isMovingNodes.current) return;

        for (const [nodeKey, mutation] of mutatedNodes) {
          if (mutation === 'destroyed') {
            editor.update(
              () => {
                let jupyterInputNodeUuid: string | undefined;
                let jupyterOutputNodeUuid: string | undefined;

                // Find the UUID for the destroyed input node
                INPUT_UUID_TO_CODE_KEY.forEach(
                  (codeKey: NodeKey, codeUuid: UUID) => {
                    if (codeKey === nodeKey) {
                      jupyterInputNodeUuid = codeUuid;
                      jupyterOutputNodeUuid =
                        INPUT_UUID_TO_OUTPUT_UUID.get(codeUuid);
                    }
                  },
                );

                if (jupyterInputNodeUuid && jupyterOutputNodeUuid) {
                  // Remove the corresponding output node
                  const outputNodeKey = OUTPUT_UUID_TO_OUTPUT_KEY.get(
                    jupyterOutputNodeUuid,
                  );
                  if (outputNodeKey) {
                    const outputNode = $getNodeByKey(outputNodeKey);
                    if (outputNode) {
                      outputNode.markDirty();
                      (outputNode as JupyterOutputNode).removeForce();
                    }
                  }

                  // Clean up all map entries
                  INPUT_UUID_TO_CODE_KEY.delete(jupyterInputNodeUuid);
                  INPUT_UUID_TO_OUTPUT_KEY.delete(jupyterInputNodeUuid);
                  INPUT_UUID_TO_OUTPUT_UUID.delete(jupyterInputNodeUuid);
                  OUTPUT_UUID_TO_CODE_UUID.delete(jupyterOutputNodeUuid);
                  OUTPUT_UUID_TO_OUTPUT_KEY.delete(jupyterOutputNodeUuid);
                }
              },
              { discrete: true },
            );
          } else if (mutation === 'updated') {
            // Only move nodes if they're actually out of position
            editor.update(
              () => {
                const inputNode = $getNodeByKey(nodeKey);
                if (inputNode && $isJupyterInputNode(inputNode)) {
                  const inputUuid = inputNode.getJupyterInputNodeUuid();
                  const outputKey = INPUT_UUID_TO_OUTPUT_KEY.get(inputUuid);

                  if (outputKey) {
                    const outputNode = $getNodeByKey(outputKey);
                    if (outputNode) {
                      const inputNextSibling = inputNode.getNextSibling();

                      // Only move if the output node is not immediately after the input node
                      if (inputNextSibling !== outputNode) {
                        isMovingNodes.current = true;
                        try {
                          outputNode.remove(false);
                          inputNode.insertAfter(outputNode);
                        } finally {
                          isMovingNodes.current = false;
                        }
                      }
                    }
                  }
                }
              },
              { discrete: true },
            );
          }
        }
      },
    );
  }, [editor]);

  // Output node mutation listener to keep outputs with their inputs
  useEffect(() => {
    return editor.registerMutationListener(
      JupyterOutputNode,
      (mutatedNodes: Map<NodeKey, any>) => {
        // Skip if we're already moving nodes to prevent recursion
        if (isMovingNodes.current) return;

        for (const [nodeKey, mutation] of mutatedNodes) {
          if (mutation === 'updated') {
            editor.update(
              () => {
                const outputNode = $getNodeByKey(nodeKey);
                if (outputNode) {
                  const outputUuid = (
                    outputNode as JupyterOutputNode
                  ).getJupyterOutputNodeUuid();
                  const inputUuid = OUTPUT_UUID_TO_CODE_UUID.get(outputUuid);

                  if (inputUuid) {
                    const inputKey = INPUT_UUID_TO_CODE_KEY.get(inputUuid);
                    if (inputKey) {
                      const inputNode = $getNodeByKey(inputKey);
                      if (inputNode) {
                        const inputNextSibling = inputNode.getNextSibling();

                        // Only move if this output node is not immediately after its input node
                        if (inputNextSibling !== outputNode) {
                          isMovingNodes.current = true;
                          try {
                            outputNode.remove(false);
                            inputNode.insertAfter(outputNode);
                          } finally {
                            isMovingNodes.current = false;
                          }
                        }
                      }
                    }
                  }
                }
              },
              { discrete: true },
            );
          }
        }
      },
    );
  }, [editor]);

  // Listen for session changes and call onSessionConnection callback
  useEffect(() => {
    if (!onSessionConnection) return;

    // Call the callback with the current session when kernel becomes available or changes
    // Initial call
    if (kernel) {
      onSessionConnection(kernel.session);
      if (kernel.session) {
        kernel.session.statusChanged.connect(
          (sessionConnection: Session.ISessionConnection, _status: string) => {
            onSessionConnection(sessionConnection);
          },
        );
        kernel.session.connectionStatusChanged.connect(
          (
            sessionConnection: Session.ISessionConnection,
            _connectionStatus: string,
          ) => {
            onSessionConnection(sessionConnection);
          },
        );
      }
    } else {
      // Call with undefined when no kernel is available
      onSessionConnection(undefined);
    }
  }, [kernel, kernel?.session, onSessionConnection]);

  useEffect(() => {
    return registerCodeHighlighting(editor);
  }, [editor]);
  useEffect(() => {
    if (!editor.hasNodes([JupyterOutputNode])) {
      throw new Error(
        'JupyterInputOutputPlugin: JupyterOutputNode not registered on editor',
      );
    }
    if (!editor.hasNodes([JupyterInputNode])) {
      throw new Error(
        'JupyterInputOutputPlugin: JupyterInputNode not registered on editor',
      );
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand<boolean>(
      INSERT_LINE_BREAK_COMMAND,
      _event => {
        const selection = $getSelection();
        const node = selection?.getNodes()[0];
        if (node?.__parent) {
          const parentNode = $getNodeByKey(node?.__parent);
          if (parentNode && $isJupyterInputNode(parentNode)) {
            // Allow normal Enter for line breaks in JupyterInputNode
            // Execution will be handled by KEY_ENTER_COMMAND with Shift modifier
            return false;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH, // Changed to HIGH so it can handle line breaks
    );
  }, [editor]);

  // Handle Enter key - distinguish between Enter and Shift+Enter
  useEffect(() => {
    return editor.registerCommand<KeyboardEvent>(
      KEY_ENTER_COMMAND,
      event => {
        const selection = $getSelection();
        const node = selection?.getNodes()[0];
        if (node?.__parent) {
          const parentNode = $getNodeByKey(node?.__parent);
          if (parentNode && $isJupyterInputNode(parentNode)) {
            if (event.shiftKey) {
              // Shift+Enter: Execute code
              event.preventDefault();
              const code = parentNode.getTextContent();
              const jupyterInputNodeUuid = (
                parentNode as JupyterInputNode
              ).getJupyterInputNodeUuid();

              const jupyterOutputNodeKey =
                INPUT_UUID_TO_OUTPUT_KEY.get(jupyterInputNodeUuid);

              if (jupyterOutputNodeKey) {
                const jupyterOutputNode = $getNodeByKey(
                  jupyterOutputNodeKey,
                ) as JupyterOutputNode;
                if (jupyterOutputNode) {
                  // Check the existing output node's adapter kernel
                  const existingAdapter = jupyterOutputNode.__outputAdapter;

                  // Get writable node ONCE at the start
                  const writableNode =
                    jupyterOutputNode.getWritable() as JupyterOutputNode;

                  // Update kernel if needed
                  if (!existingAdapter.kernel && kernel) {
                    existingAdapter.kernel = kernel;
                  }

                  // Set the code
                  writableNode.__code = code;

                  // Handle execution
                  if (!existingAdapter.kernel) {
                    // Show user-facing warning
                    const warningOutput = createNoKernelWarning();
                    // Update BOTH the node's outputs AND the adapter's model
                    writableNode.__outputs = [warningOutput];
                    existingAdapter.setOutputs([warningOutput]);
                    writableNode.__renderTrigger++;
                  } else {
                    existingAdapter.execute(code);
                  }

                  return true;
                }
              }
              // Create new output node
              const outputAdapter = new OutputAdapter(newUuid(), kernel, []);
              const jupyterOutputNode = $createJupyterOutputNode(
                code,
                outputAdapter,
                [],
                true,
                jupyterInputNodeUuid,
                UUID.uuid4(),
              );

              // Insert the output node immediately after the input node
              parentNode.insertAfter(jupyterOutputNode);
              const nodeSelection = $createNodeSelection();
              nodeSelection.add(parentNode.__key);
              $setSelection(nodeSelection);
              return true;
            }
            // Regular Enter: Insert a line break directly
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const lineBreak = $createLineBreakNode();
              selection.insertNodes([lineBreak]);
              event.preventDefault();
              return true;
            }
            return false;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_LOW, // Changed to LOW so INSERT_LINE_BREAK_COMMAND can handle regular Enter
    );
  }, [editor, kernel]);

  // Handle Ctrl+A to select all content within a Jupyter input cell
  // Use CRITICAL priority to run before Lexical's internal select-all handler
  useEffect(() => {
    return editor.registerCommand<KeyboardEvent>(
      SELECT_ALL_COMMAND,
      (event: KeyboardEvent) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }

        // Traverse up from current node to find parent JupyterInputNode
        let currentNode: LexicalNode | null = selection.anchor.getNode();
        let jupyterInputNode: JupyterInputNode | null = null;
        let depth = 0;
        const maxDepth = 20;

        while (currentNode && depth < maxDepth) {
          if ($isJupyterInputNode(currentNode)) {
            jupyterInputNode = currentNode as JupyterInputNode;
            break;
          }

          currentNode = currentNode.getParent();
          depth++;
        }

        if (jupyterInputNode) {
          // Prevent default browser behavior only when we're handling the event
          event.preventDefault();
          event.stopPropagation();

          // Select all content within the Jupyter input node
          const rangeSelection = $createRangeSelection();
          rangeSelection.anchor.set(jupyterInputNode.getKey(), 0, 'element');
          rangeSelection.focus.set(
            jupyterInputNode.getKey(),
            jupyterInputNode.getChildrenSize(),
            'element',
          );
          $setSelection(rangeSelection);
          return true; // Prevent default select-all behavior
        }

        return false; // Allow default select-all if not in Jupyter cell
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      INSERT_JUPYTER_INPUT_OUTPUT_COMMAND,
      (props: JupyterInputOutputProps) => {
        const { code, outputs } = props;
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          // Clear any existing selection content
          selection.removeText();

          // Create the input node with the code content
          const jupyterCodeNode = $createJupyterInputNode('python');
          const jupyterCodeUuid = jupyterCodeNode.getJupyterInputNodeUuid();

          selection.insertNodes([jupyterCodeNode]);

          // Add the code content to the input node
          if (code) {
            selection.insertRawText(code);
          }

          // Create the output node with kernel (may be undefined - that's OK!)
          const outputAdapter = new OutputAdapter(newUuid(), kernel, outputs);
          const jupyterOutputNode = $createJupyterOutputNode(
            code,
            outputAdapter,
            outputs || [],
            true,
            jupyterCodeUuid,
            UUID.uuid4(),
          );

          outputAdapter.outputArea.model.changed.connect(
            (
              outputModel: IOutputAreaModel,
              _args: IOutputAreaModel.ChangedArgs,
            ) => {
              editor.update(
                () => {
                  jupyterOutputNode.setOutputs(outputModel.toJSON());
                },
                { discrete: true },
              ); // Use discrete to avoid cluttering undo stack
            },
          );

          // Get the parent to insert the output node
          const parent = jupyterCodeNode.getParent();
          if (parent) {
            // Insert the output node immediately after the input node
            jupyterCodeNode.insertAfter(jupyterOutputNode);
          }

          // Position cursor at the beginning of the jupyter-input node
          jupyterCodeNode.selectStart();
        }
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor, kernel]);

  /**
   * Helper function to execute code for a given input node.
   * Centralizes adapter/kernel setup and code execution logic.
   */
  const executeInputNode = useCallback(
    (node: JupyterInputNode, kernelToUse: Kernel) => {
      const code = node.getTextContent();
      const jupyterInputNodeUuid = node.getJupyterInputNodeUuid();
      const jupyterOutputNodeKey =
        INPUT_UUID_TO_OUTPUT_KEY.get(jupyterInputNodeUuid);

      if (jupyterOutputNodeKey) {
        const jupyterOutputNode = $getNodeByKey(jupyterOutputNodeKey);
        if (jupyterOutputNode) {
          // Update kernel using public API before execution
          (jupyterOutputNode as JupyterOutputNode).updateKernel(kernelToUse);
          (jupyterOutputNode as JupyterOutputNode).executeCode(code);
          return true;
        }
      }
      return false;
    },
    [],
  );

  // Handle RUN_JUPYTER_CELL_COMMAND - execute currently focused cell
  useEffect(() => {
    return editor.registerCommand(
      RUN_JUPYTER_CELL_COMMAND,
      () => {
        if (!kernel) {
          console.warn('❌ No kernel available for cell execution');
          return false;
        }

        const selection = $getSelection();
        if (!selection) return false;

        const nodes = selection.getNodes();
        const node = nodes[0];

        // Find parent JupyterInputNode using public API
        const parentNode = node?.getParent();
        if (parentNode && $isJupyterInputNode(parentNode)) {
          // Use shared helper to execute the cell
          return executeInputNode(parentNode, kernel);
        }
        return false;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor, kernel, executeInputNode]);

  // Handle RUN_ALL_JUPYTER_CELLS_COMMAND - execute all cells in document order
  useEffect(() => {
    return editor.registerCommand(
      RUN_ALL_JUPYTER_CELLS_COMMAND,
      () => {
        if (!kernel) {
          console.warn('❌ No kernel available for running all cells');
          return false;
        }

        // Collect all JupyterInputNodes in document order using public API
        const inputNodes: JupyterInputNode[] = [];

        function collectJupyterInputNodes(node: LexicalNode) {
          if ($isJupyterInputNode(node)) {
            inputNodes.push(node);
          }
          if ($isElementNode(node)) {
            const children = node.getChildren();
            for (const child of children) {
              collectJupyterInputNodes(child);
            }
          }
        }

        const root = $getRoot();
        collectJupyterInputNodes(root);

        if (inputNodes.length === 0) {
          console.warn('❌ No Jupyter cells found to execute');
          return false;
        }

        console.log(
          `🚀 Executing ${inputNodes.length} cells in document order`,
        );

        // Execute each cell in document order using shared helper
        inputNodes.forEach((node: JupyterInputNode) => {
          executeInputNode(node, kernel);
        });

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor, kernel, executeInputNode]);

  // Handle RESTART_JUPYTER_KERNEL_COMMAND - restart the kernel
  useEffect(() => {
    return editor.registerCommand(
      RESTART_JUPYTER_KERNEL_COMMAND,
      () => {
        if (!kernel?.session?.kernel) {
          console.warn('❌ No kernel session available to restart');
          return false;
        }

        // Execute restart asynchronously without blocking
        (async () => {
          try {
            if (!kernel.session.kernel) {
              console.error('❌ Kernel became null during restart');
              return;
            }
            console.log('🔄 Restarting kernel...');
            await kernel.session.kernel.restart();
            console.log('✅ Kernel restarted successfully');
          } catch (error) {
            console.error('❌ Failed to restart kernel:', error);
          }
        })();

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor, kernel]);

  // Handle CLEAR_ALL_OUTPUTS_COMMAND - clear outputs from all cells
  useEffect(() => {
    return editor.registerCommand(
      CLEAR_ALL_OUTPUTS_COMMAND,
      () => {
        let clearedCount = 0;

        // Traverse document tree and clear all JupyterOutputNode outputs
        function clearJupyterOutputs(node: LexicalNode) {
          if (node instanceof JupyterOutputNode) {
            node.setOutputs([]);
            clearedCount++;
          }
          if ($isElementNode(node)) {
            const children = node.getChildren();
            for (const child of children) {
              clearJupyterOutputs(child);
            }
          }
        }

        const root = $getRoot();
        clearJupyterOutputs(root);

        if (clearedCount > 0) {
          console.log(`✅ Cleared outputs from ${clearedCount} cells`);
        } else {
          console.warn('❌ No Jupyter cells found to clear');
        }

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
};

export default JupyterInputOutputPlugin;
