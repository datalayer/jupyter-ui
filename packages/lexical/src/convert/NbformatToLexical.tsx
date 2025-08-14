/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { LexicalEditor, INSERT_PARAGRAPH_COMMAND } from 'lexical';
import { INotebookContent, IOutput } from '@jupyterlab/nbformat';
// import { INSERT_JUPYTER_CELL_OUTPUT_COMMAND } from "../plugins/JupyterCellOutputPlugin";
import { INSERT_JUPYTER_CELL_COMMAND } from '../plugins/JupyterCellPlugin';
import { $convertFromMarkdownString, TRANSFORMERS } from './markdown';

export const nbformatToLexical = (
  notebook: INotebookContent,
  editor: LexicalEditor,
) => {
  editor.update(() => {
    notebook.cells.map(cell => {
      let code = '';
      if (typeof cell.source === 'object') {
        code = (cell.source as string[]).join('\n');
      }
      if (typeof cell.source === 'string') {
        code = cell.source as string;
      }
      if (cell.cell_type === 'markdown') {
        $convertFromMarkdownString(code, TRANSFORMERS);
      }
      if (cell.cell_type === 'code') {
        const outputs = cell.outputs as IOutput[];
        editor.dispatchCommand(INSERT_JUPYTER_CELL_COMMAND, {
          code,
          outputs,
          loading: 'Loading...',
          autoStart: false,
        });
      }
      editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
    });
  });
};

export default nbformatToLexical;
