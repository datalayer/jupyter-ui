/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect } from "react";
import { $insertNodes, COMMAND_PRIORITY_EDITOR, createCommand } from "lexical";
import { IOutput } from '@jupyterlab/nbformat';
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { JupyterCellNode, $createJupyterCellNode } from "../nodes/JupyterCellNode";

export type JupyterCellProps = {
  code: string;
  outputs: IOutput[];
  loading: string;
  autoStart: boolean;
}

export const INSERT_JUPYTER_CELL_COMMAND = createCommand<JupyterCellProps>();

export function JupyterCellPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (!editor.hasNodes([JupyterCellNode])) {
      throw new Error(
        "JupyterCellNode is not registered."
      );
    }
    return editor.registerCommand(INSERT_JUPYTER_CELL_COMMAND, (props: JupyterCellProps) => {
        const jupyterNode = $createJupyterCellNode(props);
        $insertNodes([jupyterNode]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);
  return null;
}

export default JupyterCellPlugin;
