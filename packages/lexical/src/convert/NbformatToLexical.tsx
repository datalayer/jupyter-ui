/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import {
  $getRoot,
  $setSelection,
  INSERT_PARAGRAPH_COMMAND,
  LexicalEditor,
} from 'lexical';
import { INotebookContent, IOutput } from '@jupyterlab/nbformat';
// import { INSERT_JUPYTER_CELL_COMMAND } from '../plugins/JupyterCellPlugin';
import { INSERT_JUPYTER_INPUT_OUTPUT_COMMAND } from '../plugins/JupyterInputOutputPlugin';
import { $convertFromMarkdownString, TRANSFORMERS } from './markdown';

export const nbformatToLexical = (
  notebook: INotebookContent,
  editor: LexicalEditor,
) => {
  editor.update(() => {
    // Start from a clean root so repeated conversions do not accumulate nodes
    // and clear stale selections that may reference removed nodes.
    const root = $getRoot();
    $setSelection(null);
    root.clear();
    root.selectStart();

    notebook.cells.forEach((cell, index) => {
      let code = '';
      if (Array.isArray(cell.source)) {
        // In nbformat, `source` is an array of lines where each line already
        // carries its own trailing newline. Join with '' (not '\n') so cells
        // are reconstructed verbatim instead of gaining spurious blank lines.
        code = (cell.source as string[]).join('');
      } else if (typeof cell.source === 'string') {
        code = cell.source as string;
      }
      // Always anchor the selection at the end of the document before inserting
      // the next cell. Inserting a block node can leave the collapsed selection
      // pointing inside the freshly inserted node, which caused the following
      // cell to be inserted *before* and merged into the previous one (e.g.
      // "plt.show()x=1").
      root.selectEnd();
      if (cell.cell_type === 'markdown') {
        $convertFromMarkdownString(code, TRANSFORMERS);
      }
      if (cell.cell_type === 'code') {
        const outputs = cell.outputs as IOutput[];
        editor.dispatchCommand(INSERT_JUPYTER_INPUT_OUTPUT_COMMAND, {
          code,
          outputs,
          loading: 'Loading...',
          // autoStart: false,
        });
      }
      // Only add paragraph between cells, not after the last cell
      if (index < notebook.cells.length - 1) {
        editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
      }
    });
  });
};

export default nbformatToLexical;
