/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { LexicalEditor, INSERT_PARAGRAPH_COMMAND } from "lexical";
import { INotebookContent, IOutput } from "@jupyterlab/nbformat";
import { INSERT_JUPYTER_COMMAND } from "../plugins/JupyterPlugin";
import { $convertFromMarkdownString, TRANSFORMERS } from "./markdown";

export const nbformatToLexical = (notebook: INotebookContent, editor: LexicalEditor) => {
  editor.update(() => {
    notebook.cells.map(cell => {
      let source = '';
      if (typeof cell.source === 'object') {
        source = (cell.source as string[]).join('\n');
      }
      if (typeof cell.source === 'string') {
        source = cell.source as string;
      }
      if (cell.cell_type === 'markdown') {
        $convertFromMarkdownString(source, TRANSFORMERS);
      }
      if (cell.cell_type === 'code') {
        const outputs = cell.outputs as IOutput[];
        editor.dispatchCommand(INSERT_JUPYTER_COMMAND, { code: source, outputs: outputs, loading: "initial" })
      }
      editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
    });
  });
}

export default nbformatToLexical;
