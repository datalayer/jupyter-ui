/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect } from "react";
import {  $insertNodes, COMMAND_PRIORITY_EDITOR, createCommand } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { CustomNode, $createCustomNode } from "../nodes/CustomNode";

export const INSERT_CUSTOM_COMMAND = createCommand();

export function CustomPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (!editor.hasNodes([CustomNode])) {
      throw new Error(
        "CustomNode is not registered."
      );
    }
    return editor.registerCommand(
      INSERT_CUSTOM_COMMAND,
      () => {
        const customNode = $createCustomNode();
        $insertNodes([customNode]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);
  return null;
}

export default CustomPlugin;
