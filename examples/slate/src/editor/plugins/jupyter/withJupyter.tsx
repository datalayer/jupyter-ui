/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { createElement } from "react";
import { Editor, Transforms, Path, Range, NodeEntry } from 'slate';
import { newSourceId, Output, Kernel } from "@datalayer/jupyter-react";
import { JupyterCellElement } from "../../../slate";

const NEW_CODE = 'print(\'Hello 👍\')'

export const insertCell = (editor: Editor, kernel: Kernel) => {
  const [match] = Editor.nodes(editor, {
    match: (n) => Editor.isBlock(editor, n),
  });
  const path = match ? Path.next(match[1]) : [editor.children.length];
  Transforms.insertNodes(
    editor,
    {
      type: 'jupyter-cell',
      output: createElement(Output, {
        showEditor: false,
        autoRun: true,
        disableRun: false,
        sourceId: newSourceId(""),
        toolbarPosition: "up",
        kernel: kernel,
        code: NEW_CODE,
        executeTrigger: 0,
        clearTrigger: 0,
        luminoWidgets: true
      }),
      clearTrigger: 0,
      executeTrigger: 0,
      children: [{ text: NEW_CODE }],
    },
    { at: path }
  );
}

export const executeCell = (editor: Editor) => {
  const nodes = Editor.nodes(editor, {
    at: editor.selection as Range,
    mode: "lowest",
    match: (n) => Editor.isBlock(editor, n),
  });
  const cellEntry = nodes.next().value as NodeEntry<JupyterCellElement>;
  const jupyterCellElement = cellEntry[0];
  const path = cellEntry[1];
  Transforms.setNodes(editor,
    { executeTrigger: jupyterCellElement.executeTrigger + 1 },
    { at: path }
  );
}

export const clearOutput = (editor: Editor) => {
  const nodes = Editor.nodes(editor, {
    at: editor.selection as Range,
    mode: "lowest",
    match: (n) => Editor.isBlock(editor, n),
  });
  const cellEntry = nodes.next().value as NodeEntry<JupyterCellElement>;
  const JupyterCellElement = cellEntry[0];
  const path = cellEntry[1];
  Transforms.setNodes(editor,
    { clearTrigger: JupyterCellElement.clearTrigger + 1 },
    { at: path }
  );
}

const withJupyter = (editor: Editor) => {
  const { isVoid } = editor;
  editor.isVoid = element => {
    switch (element.type) {
      case 'jupyter-cell':
        return false;
      case 'jupyter-filebrowser':
        return true;
      default:
        return isVoid(element);
    }
  }
  return editor;
}

export default withJupyter;
