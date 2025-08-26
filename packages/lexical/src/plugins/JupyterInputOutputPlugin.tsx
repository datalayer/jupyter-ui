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
  KEY_ENTER_COMMAND,
  COMMAND_PRIORITY_LOW,
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $createRangeSelection,
  LexicalNode,
  $getNodeByKey,
  $createNodeSelection,
  $setSelection,
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
import {
  $createJupyterInputNode,
  JupyterInputNode,
  $isJupyterInputNode,
} from '../nodes/JupyterInputNode';
import { $isJupyterInputHighlightNode } from '../nodes/JupyterInputHighlightNode';
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
      'text/html': ['<p>Type code in the cell and Shift+Enter to execute.</p>'],
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
        kernel.session.statusChanged.connect((sessionConnection, args) => {
          onSessionConnection(sessionConnection);
        });
        kernel.session.connectionStatusChanged.connect(
          (sessionConnection, args) => {
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
                const jupyterOutputNode = $getNodeByKey(jupyterOutputNodeKey);
                if (jupyterOutputNode) {
                  // Execute code on existing output node without excessive logging
                  (jupyterOutputNode as JupyterOutputNode).executeCode(code);
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
              console.warn('🟢 Code execution completed');
              return true;
            }
            console.warn(
              '🟢 Regular Enter in JupyterInputNode - inserting line break',
            );
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
        console.warn('🟢 Not in JupyterInputNode - returning false');
        return false;
      },
      COMMAND_PRIORITY_LOW, // Changed to LOW so INSERT_LINE_BREAK_COMMAND can handle regular Enter
    );
  }, [editor, kernel]);

  // Handle Ctrl+A to select all content within a Jupyter input cell
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+A (or Cmd+A on Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        const eventTarget = event.target as HTMLElement;

        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return;
          }

          let jupyterInputNode: JupyterInputNode | null = null;

          // Method 1: Traverse up the tree hierarchy from anchor node
          const anchorNode = selection.anchor.getNode();
          let currentNode: LexicalNode | null = anchorNode;
          let depth = 0;

          console.log(`🔍 Starting hierarchy traversal from anchor node:`, {
            type: anchorNode.getType(),
            key: anchorNode.getKey(),
            parent: anchorNode.__parent,
            textContent: anchorNode.getTextContent?.() || 'N/A',
          });

          // Traverse up the parent hierarchy to find JupyterInputNode or JupyterInputHighlightNode
          while (currentNode && depth < 15) {
            const parentKey = currentNode.__parent;
            console.log(`🔍 Depth ${depth}:`, {
              type: currentNode.getType(),
              key: currentNode.getKey(),
              parentKey: parentKey,
              hasParent: !!parentKey,
              isJupyterInput: $isJupyterInputNode(currentNode),
              isJupyterHighlight: $isJupyterInputHighlightNode(currentNode),
              textContent: currentNode.getTextContent?.() || 'N/A',
            });

            // Check if current node is a JupyterInputNode
            if ($isJupyterInputNode(currentNode)) {
              jupyterInputNode = currentNode as JupyterInputNode;
              console.log(
                `🎯 SUCCESS: Found JupyterInputNode at depth ${depth}`,
              );
              break;
            }

            // Check if current node is a JupyterInputHighlightNode - then look for its JupyterInputNode parent
            if ($isJupyterInputHighlightNode(currentNode)) {
              console.log(
                `🔍 Found JupyterInputHighlightNode at depth ${depth}, checking its parent chain...`,
              );

              // Look for JupyterInputNode parent of the highlight node
              let parentNode: LexicalNode | null = currentNode;
              let parentDepth = 0;

              while (parentNode && parentDepth < 5) {
                if (parentNode.__parent) {
                  const nextParent: LexicalNode | null = $getNodeByKey(
                    parentNode.__parent,
                  );
                  parentDepth++;

                  if (nextParent) {
                    console.log(`🔍   Parent chain depth ${parentDepth}:`, {
                      type: nextParent.getType(),
                      key: nextParent.getKey(),
                      parentKey: nextParent.__parent,
                      isJupyterInput: $isJupyterInputNode(nextParent),
                      isJupyterHighlight:
                        $isJupyterInputHighlightNode(nextParent),
                    });

                    if ($isJupyterInputNode(nextParent)) {
                      jupyterInputNode = nextParent as JupyterInputNode;
                      console.log(
                        `🎯 SUCCESS: Found JupyterInputNode parent at parent depth ${parentDepth}`,
                      );
                      break;
                    }
                    parentNode = nextParent;
                  } else {
                    console.log(
                      `🔍   Parent chain depth ${parentDepth}: null parent`,
                    );
                    break;
                  }
                } else {
                  console.log(
                    `🔍   Parent chain depth ${parentDepth}: no parent key`,
                  );
                  break;
                }
              }

              if (jupyterInputNode) break;
            }

            // Move to parent for next iteration
            if (currentNode.__parent) {
              const nextParent: LexicalNode | null = $getNodeByKey(
                currentNode.__parent,
              );
              if (nextParent) {
                console.log(`🔍 Moving to parent at depth ${depth + 1}:`, {
                  fromType: currentNode.getType(),
                  toType: nextParent.getType(),
                  fromKey: currentNode.getKey(),
                  toKey: nextParent.getKey(),
                });
                currentNode = nextParent;
              } else {
                console.log(
                  `🔍 Parent key exists but $getNodeByKey returned null at depth ${depth}`,
                );
                currentNode = null;
              }
            } else {
              console.log(
                `🔍 No parent key at depth ${depth}, stopping traversal`,
              );
              currentNode = null;
            }
            depth++;
          }

          // Method 2: DOM-based fallback - check if event target is inside a Jupyter input container
          if (!jupyterInputNode && eventTarget) {
            console.log('🔍 Trying DOM-based detection...');

            // Look for common Jupyter input container patterns
            const jupyterContainer = eventTarget.closest(
              '.jupyter-input, [data-jupyter-input], .CodeMirror, .monaco-editor, pre[data-language]',
            );

            if (jupyterContainer) {
              console.log('🔍 Found potential Jupyter container via DOM');

              // Find any Jupyter input node in the editor state
              const nodeMap = (editor.getEditorState() as any)._nodeMap as Map<
                string,
                LexicalNode
              >;
              for (const [, node] of nodeMap) {
                if ($isJupyterInputNode(node)) {
                  jupyterInputNode = node as JupyterInputNode;
                  console.log(
                    '🎯 Found JupyterInputNode via DOM container fallback',
                  );
                  break;
                }
              }
            }
          }

          if (jupyterInputNode) {
            event.preventDefault();

            // Create a new range selection that covers all content in the Jupyter input node
            const rangeSelection = $createRangeSelection();
            rangeSelection.anchor.set(jupyterInputNode.getKey(), 0, 'element');
            rangeSelection.focus.set(
              jupyterInputNode.getKey(),
              jupyterInputNode.getChildrenSize(),
              'element',
            );
            $setSelection(rangeSelection);

            console.warn(
              '🎯 SUCCESS: Ctrl+A in Jupyter input cell - selected all content within cell',
            );
            return;
          }

          console.log(
            '❌ No JupyterInputNode found - allowing default Ctrl+A behavior',
          );
        });
      }
    };

    // Add event listener to the editor's root element
    const rootElement = editor.getRootElement();
    if (rootElement) {
      rootElement.addEventListener('keydown', handleKeyDown);

      return () => {
        rootElement.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [editor]);

  // TEMPORARILY DISABLED - Mutation listener causing infinite loop
  // TODO: Fix the infinite loop issue
  /*
  useEffect(() => {
    return editor.registerMutationListener(
      JupyterInputNode,
      (mutatedNodes: Map<NodeKey, NodeMutation>) => {
        for (const [nodeKey, mutation] of mutatedNodes) {
          if (mutation === 'destroyed') {
            editor.update(() => {
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
            });
          } else if (mutation === 'updated') {
            // Skip if we're currently moving an output node to prevent recursion
            if (isMovingOutputNode.current) {
              return;
            }

            editor.update(() => {
              const inputNode = $getNodeByKey(nodeKey);
              if (inputNode && $isJupyterInputNode(inputNode)) {
                const inputUuid = inputNode.getJupyterInputNodeUuid();
                const outputKey = INPUT_UUID_TO_OUTPUT_KEY.get(inputUuid);

                if (outputKey) {
                  const outputNode = $getNodeByKey(outputKey);
                  if (outputNode) {
                    const inputNextSibling = inputNode.getNextSibling();

                    // If the output node is not immediately after the input node, move it
                    if (inputNextSibling !== outputNode) {
                      isMovingOutputNode.current = true;
                      try {
                        outputNode.remove(false);
                        inputNode.insertAfter(outputNode);
                      } finally {
                        isMovingOutputNode.current = false;
                      }
                    }
                  }
                }
              }
            }, { discrete: true }); // Use discrete to avoid undo stack pollution
          }
        }
      },
    );
  }, [editor]);
  */

  // TEMPORARILY DISABLED - Output mutation listener also causing infinite loop
  /*
  // Add a mutation listener for output nodes to ensure they stay with their input nodes
  useEffect(() => {
    return editor.registerMutationListener(
      JupyterOutputNode,
      (mutatedNodes: Map<NodeKey, NodeMutation>) => {
        for (const [nodeKey, mutation] of mutatedNodes) {
          if (mutation === 'updated' && !isMovingOutputNode.current) {
            editor.update(() => {
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

                      // If this output node is not immediately after its input node, move it
                      if (inputNextSibling !== outputNode) {
                        isMovingOutputNode.current = true;
                        try {
                          outputNode.remove(false);
                          inputNode.insertAfter(outputNode);
                        } finally {
                          isMovingOutputNode.current = false;
                        }
                      }
                    }
                  }
                }
              }
            }, { discrete: true }); // Use discrete to avoid undo stack pollution
          }
        }
      },
    );
  }, [editor]);
  */

  useEffect(() => {
    return editor.registerCommand(
      INSERT_JUPYTER_INPUT_OUTPUT_COMMAND,
      (props: JupyterInputOutputProps) => {
        const { code, outputs } = props;
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          // Check if kernel is undefined
          if (!kernel) {
            // Clear any existing selection content
            selection.removeText();

            // Create a paragraph with the message
            const paragraph = $createParagraphNode();
            const textNode = $createTextNode(
              'A runtime is needed to insert Jupyter Cells',
            );
            paragraph.append(textNode);
            selection.insertNodes([paragraph]);
            return true;
          }

          // Clear any existing selection content
          selection.removeText();

          // Create the input node with the code content
          const jupyterCodeNode = $createJupyterInputNode('python');
          selection.insertNodes([jupyterCodeNode]);

          // Add the code content to the input node
          if (code) {
            selection.insertRawText(code);
          }

          // Create the output node
          const outputAdapter = new OutputAdapter(newUuid(), kernel, outputs);
          const jupyterOutputNode = $createJupyterOutputNode(
            code,
            outputAdapter,
            outputs || [],
            true,
            jupyterCodeNode.getJupyterInputNodeUuid(),
            UUID.uuid4(),
          );

          outputAdapter.outputArea.model.changed.connect(
            (outputModel, _args) => {
              editor.update(
                () => {
                  jupyterOutputNode.setOutputs(outputModel.toJSON());
                },
                { discrete: true },
              ); // Use discrete to avoid cluttering undo stack
            },
          );

          // Insert the output node immediately after the input node
          jupyterCodeNode.insertAfter(jupyterOutputNode);

          // Position cursor at the beginning of the jupyter-input node
          jupyterCodeNode.selectStart();
        }
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor, kernel]);

  return null;
};

export default JupyterInputOutputPlugin;
