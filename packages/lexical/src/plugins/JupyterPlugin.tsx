import { useEffect } from "react";
import { $getSelection, $isRangeSelection, createCommand, NodeKey, COMMAND_PRIORITY_EDITOR, INSERT_LINE_BREAK_COMMAND, COMMAND_PRIORITY_HIGH, NodeMutation, $isLineBreakNode, $isElementNode } from "lexical";
import { $getNodeByKey, $createNodeSelection, $setSelection } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $wrapNodes, } from "@lexical/selection";
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { OutputAdapter } from '@datalayer/jupyter-react';
import { UUID } from '@lumino/coreutils';
import { IOutput } from '@jupyterlab/nbformat';
import { $createJupyterCodeNode } from "../nodes/JupyterCodeNode";
import { $isJupyterCodeNode } from "../nodes/JupyterCodeNode";
import { registerCodeHighlighting } from "../nodes/JupyterCodeHighlighter";
import { JupyterOutputNode, $createJupyterOutputNode } from "../nodes/JupyterOutputNode";
import { JupyterCodeNode } from "../nodes/JupyterCodeNode";

import "./JupyterPlugin.css";

export const CODE_UUID_TO_OUTPUT_KEY = new Map<string, NodeKey | undefined>();
export const CODE_UUID_TO_CODE_KEY = new Map<string, NodeKey | undefined>();
export const CODE_UUID_TO_OUTPUT_UUID = new Map<string, string | undefined>();
export const OUTPUT_UUID_TO_CODE_UUID = new Map<string, string | undefined>();
export const OUTPUT_UUID_TO_OUTPUT_KEY = new Map<string, NodeKey | undefined>();

export const DEFAULT_INITIAL_OUTPUTS: IOutput[] = [
  {
    "output_type": "execute_result",
    "data": {
      "text/html": [
        "<p>Type code in the cell and Shift+Enter to execute.</p>"
      ]
    },
    "execution_count": 0,
    "metadata": {},
  }
];

export type JupyterOutputProps = {
  code: string;
  outputs?: IOutput[];
  loading?: string;
}

export const INSERT_JUPYTER_CELL_COMMAND = createCommand<JupyterOutputProps>();

export const JupyterPlugin = () => {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return registerCodeHighlighting(editor);
  }, [editor]);
  useEffect(() => {
    if (!editor.hasNodes([JupyterOutputNode])) {
      throw new Error(
        "JupyterPlugin: JupyterOutputNode not registered on editor"
      );
    }
  }, [editor]);
  useEffect(() => {
    return editor.registerCommand<boolean>( 
      INSERT_LINE_BREAK_COMMAND,
      (event) => {
        const selection = $getSelection();
        const node = selection?.getNodes()[0];
        if (node?.__parent) {
          const parentNode = $getNodeByKey(node?.__parent);
          if ($isJupyterCodeNode(parentNode)) {
            const code = parentNode.getTextContent();
            const codeNodeUuid = parentNode.getCodeNodeUuid();
            const jupyterOutputNodeKey = CODE_UUID_TO_OUTPUT_KEY.get(codeNodeUuid);
            if (jupyterOutputNodeKey) {
              const jupyterOutputNode = $getNodeByKey(jupyterOutputNodeKey);
              if (jupyterOutputNode) {
                (jupyterOutputNode as JupyterOutputNode).executeCode(code);
                return true;
              }
            }
            const jupyterOutputNode = $createJupyterOutputNode(code, new OutputAdapter(undefined, []), [], true, codeNodeUuid, UUID.uuid4());
            $insertNodeToNearestRoot(jupyterOutputNode);
            const nodeSelection = $createNodeSelection();
            nodeSelection.add(parentNode.__key);
            $setSelection(nodeSelection);
            return true;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH, 
    );
  }, [editor]);
  useEffect(() => {
    return editor.registerMutationListener(
      JupyterCodeNode,
      (mutatedNodes: Map<NodeKey, NodeMutation>) => {
        for (let [nodeKey, mutation] of mutatedNodes) {
          if (mutation === "destroyed") {
            editor.update(() => {
//              let codeNodeUuid: string | undefined;
              let outputNodeUuid: string | undefined;
              // TODO Do not use forEach...
              CODE_UUID_TO_CODE_KEY.forEach((codeKey: NodeKey, codeUuid: string) => {
                if (codeKey === nodeKey) {
//                  codeNodeUuid = codeUuid;
                  outputNodeUuid = CODE_UUID_TO_OUTPUT_UUID.get(codeUuid);
                }
              });
              if (outputNodeUuid) {
                const outputNodeKey = OUTPUT_UUID_TO_OUTPUT_KEY.get(outputNodeUuid);
                if (outputNodeKey) {
                  const outputNode = $getNodeByKey(outputNodeKey);
                  if (outputNode) {
                    outputNode.markDirty();
                    (outputNode as JupyterOutputNode).removeForce();
                  }
                }
//                CODE_UUID_TO_OUTPUT_UUID.delete(codeNodeUuid);
//                CODE_UUID_TO_OUTPUT_KEY.delete(codeNodeUuid);
//                CODE_UUID_TO_CODE_KEY.delete(codeNodeUuid);
              }
              if (outputNodeUuid) {
//                OUTPUT_UUID_TO_CODE_UUID.delete(outputNodeUuid);
              }
            });
          }
        }
      }
    )
  }, [editor]);
  useEffect(() => {
    return editor.registerCommand(INSERT_JUPYTER_CELL_COMMAND, (props: JupyterOutputProps) => {
      const { code, outputs, loading } = props;
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.removeText();
        const jupyterCodeNode = $createJupyterCodeNode("python");
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
          $wrapNodes(selection, () => jupyterCodeNode);
        } else {
          selection.insertNodes([jupyterCodeNode]);
        }
        const outputAdapter = new OutputAdapter(undefined, outputs);
        const jupyterOutputNode = $createJupyterOutputNode(code, outputAdapter, outputs || [], false, jupyterCodeNode.getCodeNodeUuid(), UUID.uuid4()) ;
        outputAdapter.outputArea.model.changed.connect((outputModel, args) => {
          editor.update(() => {
            jupyterOutputNode.setOutputs(outputModel.toJSON());
          });
        });
        $insertNodeToNearestRoot(jupyterOutputNode);
        if (!loading) {
          jupyterCodeNode.selectEnd();
//          selection.insertRawText(code);
        }
      }
      return true;
    },
    COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);
  return null;
}

export default JupyterPlugin;
