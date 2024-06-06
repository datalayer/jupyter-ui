/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect } from "react";
import {  $insertNodes, COMMAND_PRIORITY_EDITOR, createCommand } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { JupyterCellNode, $createJupyterCellNode } from "../nodes/JupyterCellNode";

export const INSERT_JUPYTER_CELL_COMMAND = createCommand();

export function JupyterCellPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (!editor.hasNodes([JupyterCellNode])) {
      throw new Error(
        "CustomNode is not registered."
      );
    }
    return editor.registerCommand(
      INSERT_JUPYTER_CELL_COMMAND,
      () => {
        const jupyterNode = $createJupyterCellNode();
        $insertNodes([jupyterNode]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);
  return null;
}

export default JupyterCellPlugin;
