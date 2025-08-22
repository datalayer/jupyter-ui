/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  createCommand,
  NodeKey,
  COMMAND_PRIORITY_EDITOR,
  INSERT_LINE_BREAK_COMMAND,
  COMMAND_PRIORITY_HIGH,
  NodeMutation,
  $isLineBreakNode,
  $isElementNode,
  $insertNodes,
  $createParagraphNode,
  KEY_ENTER_COMMAND,
  COMMAND_PRIORITY_LOW,
  $createLineBreakNode,
} from 'lexical';
import { $getNodeByKey, $createNodeSelection, $setSelection } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $setBlocksType } from '@lexical/selection';
import { $insertNodeToNearestRoot } from '@lexical/utils';
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
import { $createCounterNode } from '../nodes/CounterNode';

export const INPUT_UUID_TO_OUTPUT_KEY = new Map<string, NodeKey | undefined>();
export const INPUT_UUID_TO_CODE_KEY = new Map<string, NodeKey | undefined>();
export const INPUT_UUID_TO_OUTPUT_UUID = new Map<string, string | undefined>();
export const OUTPUT_UUID_TO_CODE_UUID = new Map<string, string | undefined>();
export const OUTPUT_UUID_TO_OUTPUT_KEY = new Map<string, NodeKey | undefined>();

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
  useEffect(() => {
    return registerCodeHighlighting(editor);
  }, [editor]);
  useEffect(() => {
    if (!editor.hasNodes([JupyterOutputNode])) {
      throw new Error(
        'JupyterCellOutputPlugin: JupyterOutputNode not registered on editor',
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
              /*
              const jupyterOutputNode = $createJupyterOutputNode(
//                code,
                '1+1',
                new OutputAdapter(newUuid(), kernel, []),
                [],
                true,
                jupyterInputNodeUuid,
                UUID.uuid4(),
              );*/
              const jupyterOutputNode = $createCounterNode();
              console.warn('🟢 Created output node:', jupyterOutputNode);
              $insertNodeToNearestRoot(jupyterOutputNode);
              console.warn('🟢 Inserted output node to root');
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
              //              let jupyterInputNodeUuid: string | undefined;
              let jupyterOutputNodeUuid: string | undefined;
              // TODO Do not use forEach...
              INPUT_UUID_TO_CODE_KEY.forEach(
                (codeKey: NodeKey, codeUuid: string) => {
                  if (codeKey === nodeKey) {
                    //                  jupyterInputNodeUuid = codeUuid;
                    jupyterOutputNodeUuid =
                      INPUT_UUID_TO_OUTPUT_UUID.get(codeUuid);
                  }
                },
              );
              if (jupyterOutputNodeUuid) {
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
                //                CODE_UUID_TO_OUTPUT_UUID.delete(jupyterInputNodeUuid);
                //                CODE_UUID_TO_OUTPUT_KEY.delete(jupyterInputNodeUuid);
                //                CODE_UUID_TO_CODE_KEY.delete(jupyterInputNodeUuid);
              }
              if (jupyterOutputNodeUuid) {
                //                OUTPUT_UUID_TO_CODE_UUID.delete(jupyterOutputNodeUuid);
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
        const { code, outputs, loading } = props;
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.removeText();
          const jupyterCodeNode = $createJupyterInputNode('python');
          /*
        if (selection.isCollapsed()) {
          const paragraphNode = $createParagraphNode();
          const textNode = $createTextNode(code || "");
          paragraphNode.append(textNode);
          selection.insertNodes([paragraphNode]);
          $wrapNodes(selection, () => codeNode);
        } else {
          const textContent = selection.getTextContent();
          selection.insertNodes([codeNode]);
          selection.insertRawText(textContent);
        }
        */
          if (selection.isCollapsed()) {
            const anchorNode = selection.anchor.getNode();
            if (anchorNode && $isElementNode(anchorNode)) {
              const nodes = anchorNode.getChildren();
              nodes.map((node: any) => {
                if ($isLineBreakNode(node)) {
                  node.remove();
                }
              });
            }
            selection.insertRawText(code);
            $setBlocksType(selection, () => jupyterCodeNode);
          } else {
            selection.insertNodes([jupyterCodeNode]);
          }
          const outputAdapter = new OutputAdapter(newUuid(), kernel, outputs);
          const jupyterOutputNode = $createJupyterOutputNode(
            code,
            outputAdapter,
            outputs || [],
            false,
            jupyterCodeNode.getJupyterInputNodeUuid(),
            UUID.uuid4(),
          );
          outputAdapter.outputArea.model.changed.connect(
            (outputModel, args) => {
              editor.update(() => {
                jupyterOutputNode.setOutputs(outputModel.toJSON());
              });
            },
          );
          const tmpParagraph = $createParagraphNode();
          $insertNodes([tmpParagraph]);
          $insertNodeToNearestRoot(jupyterOutputNode);
          tmpParagraph.remove();
          if (!loading) {
            jupyterCodeNode.selectEnd();
            //          selection.insertRawText(code);
          }
        }
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor, kernel]);
  return null;
};

export default JupyterInputOutputPlugin;
