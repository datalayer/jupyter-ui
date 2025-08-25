/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useCallback } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  createCommand,
  NodeKey,
  COMMAND_PRIORITY_EDITOR,
  INSERT_LINE_BREAK_COMMAND,
  COMMAND_PRIORITY_HIGH,
  NodeMutation,
  KEY_ENTER_COMMAND,
  COMMAND_PRIORITY_LOW,
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
} from 'lexical';
import { $getNodeByKey, $createNodeSelection, $setSelection } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { OutputAdapter, newUuid, Kernel } from '@datalayer/jupyter-react';
import { UUID } from '@lumino/coreutils';
import { IOutput } from '@jupyterlab/nbformat';
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
};

export const INSERT_JUPYTER_INPUT_OUTPUT_COMMAND =
  createCommand<JupyterInputOutputProps>();

export const JupyterInputOutputPlugin = (
  props?: JupyterInputOutputPluginProps,
) => {
  const { kernel } = props || {};
  const [editor] = useLexicalComposerContext();

  // Flag to prevent infinite recursion when moving output nodes
  const isMovingOutputNode = { current: false };

  // Function to update all existing output nodes with the current kernel
  const updateAllOutputNodesWithKernel = useCallback(() => {
    if (!kernel) return;

    editor.update(() => {
      editor.getEditorState()._nodeMap.forEach(node => {
        if (node instanceof JupyterOutputNode) {
          // Update the kernel for this output node
          node.updateKernel(kernel);
        }
      });
    });
  }, [kernel, editor]);

  // Update output nodes when kernel becomes available
  useEffect(() => {
    if (kernel) {
      updateAllOutputNodesWithKernel();
    }
  }, [kernel, updateAllOutputNodesWithKernel]);

  // Also update nodes when editor state changes (e.g., when loading a model)
  useEffect(() => {
    const removeListener = editor.registerUpdateListener(
      ({ editorState: _editorState }) => {
        if (kernel) {
          // Small delay to ensure the nodes are fully loaded
          setTimeout(() => {
            updateAllOutputNodesWithKernel();
          }, 100);
        }
      },
    );

    return removeListener;
  }, [editor, kernel, updateAllOutputNodesWithKernel]);

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
        console.warn('🔵 INSERT_LINE_BREAK_COMMAND triggered');
        const selection = $getSelection();
        const node = selection?.getNodes()[0];
        console.warn('🔵 Selection node:', node);
        if (node?.__parent) {
          const parentNode = $getNodeByKey(node?.__parent);
          console.warn(
            '🔵 Parent node:',
            parentNode,
            'Type:',
            parentNode?.getType(),
          );
          if (parentNode && $isJupyterInputNode(parentNode)) {
            console.warn(
              '🔵 Inside JupyterInputNode - allowing line break (returning false)',
            );
            // Allow normal Enter for line breaks in JupyterInputNode
            // Execution will be handled by KEY_ENTER_COMMAND with Shift modifier
            return false;
          }
        }
        console.warn('🔵 Not in JupyterInputNode - returning false');
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
        console.warn('🟢 KEY_ENTER_COMMAND triggered', {
          key: event.key,
          shiftKey: event.shiftKey,
          ctrlKey: event.ctrlKey,
          altKey: event.altKey,
        });
        const selection = $getSelection();
        const node = selection?.getNodes()[0];
        console.warn('🟢 Selection node:', node);
        if (node?.__parent) {
          const parentNode = $getNodeByKey(node?.__parent);
          console.warn(
            '🟢 Parent node:',
            parentNode,
            'Type:',
            parentNode?.getType(),
          );
          if (parentNode && $isJupyterInputNode(parentNode)) {
            if (event.shiftKey) {
              console.warn('🟢 Shift+Enter detected - executing code');
              // Shift+Enter: Execute code
              event.preventDefault();
              const code = parentNode.getTextContent();
              console.warn('🟢 Code to execute:', code);
              const jupyterInputNodeUuid = (
                parentNode as JupyterInputNode
              ).getJupyterInputNodeUuid();
              console.warn('🟢 Input node UUID:', jupyterInputNodeUuid);
              const jupyterOutputNodeKey =
                INPUT_UUID_TO_OUTPUT_KEY.get(jupyterInputNodeUuid);
              console.warn(
                '🟢 Existing output node key:',
                jupyterOutputNodeKey,
              );
              if (jupyterOutputNodeKey) {
                const jupyterOutputNode = $getNodeByKey(jupyterOutputNodeKey);
                console.warn(
                  '🟢 Found existing output node:',
                  jupyterOutputNode,
                );
                if (jupyterOutputNode) {
                  console.warn('🟢 Executing code on existing output node');
                  console.warn(
                    '🟢 Output adapter:',
                    (jupyterOutputNode as JupyterOutputNode).__outputAdapter,
                  );
                  console.warn(
                    '🟢 Output adapter kernel:',
                    (jupyterOutputNode as JupyterOutputNode).__outputAdapter
                      ?.kernel,
                  );
                  (jupyterOutputNode as JupyterOutputNode).executeCode(code);
                  return true;
                }
              }
              console.warn('🟢 Creating new output node');
              console.warn('🟢 Available kernel:', kernel);
              const outputAdapter = new OutputAdapter(newUuid(), kernel, []);
              const jupyterOutputNode = $createJupyterOutputNode(
                code,
                outputAdapter,
                [],
                true,
                jupyterInputNodeUuid,
                UUID.uuid4(),
              );

              console.warn('🟢 Created output node:', jupyterOutputNode);
              // Insert the output node immediately after the input node
              parentNode.insertAfter(jupyterOutputNode);
              console.warn('🟢 Inserted output node after input node');
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
            });
          }
        }
      },
    );
  }, [editor]);

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
            });
          }
        }
      },
    );
  }, [editor]);

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
              editor.update(() => {
                jupyterOutputNode.setOutputs(outputModel.toJSON());
              });
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
