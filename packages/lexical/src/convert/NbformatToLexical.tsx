/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * nbformat → Lexical.
 *
 * Markdown cells are read with the package's Markdown transformers (tables,
 * images, equations and rules included); code cells become Jupyter inputs
 * with their outputs through the input/output plug-in's insert command, so
 * the plug-in must be mounted on the editor; raw cells are kept as plain
 * code blocks. The root is cleared first.
 *
 * @module convert/NbformatToLexical
 */

import {
  $createTextNode,
  $getRoot,
  $setSelection,
  INSERT_PARAGRAPH_COMMAND,
  LexicalEditor,
} from 'lexical';
import { $createCodeNode } from '@lexical/code';
import { INotebookContent, IOutput } from '@jupyterlab/nbformat';
import { INSERT_JUPYTER_INPUT_OUTPUT_COMMAND } from '../plugins/JupyterInputOutputPlugin';
import { $convertFromMarkdownString } from './markdown';
import { PLAYGROUND_TRANSFORMERS } from './transformers/MarkdownTransformers';

/** The text of a cell: nbformat keeps it as one string or as lines. */
export function cellSource(source: string | string[] | undefined): string {
  if (Array.isArray(source)) {
    // Each line already carries its own trailing newline: join with nothing,
    // or every cell gains blank lines.
    return source.join('');
  }
  return typeof source === 'string' ? source : '';
}

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
      const code = cellSource(cell.source as string | string[]);
      // Always anchor the selection at the end of the document before inserting
      // the next cell. Inserting a block node can leave the collapsed selection
      // pointing inside the freshly inserted node, which caused the following
      // cell to be inserted *before* and merged into the previous one (e.g.
      // "plt.show()x=1").
      root.selectEnd();
      if (cell.cell_type === 'markdown') {
        $convertFromMarkdownString(code, PLAYGROUND_TRANSFORMERS);
      } else if (cell.cell_type === 'code') {
        const outputs = (cell.outputs ?? []) as IOutput[];
        editor.dispatchCommand(INSERT_JUPYTER_INPUT_OUTPUT_COMMAND, {
          code,
          outputs,
          loading: 'Loading...',
          // autoStart: false,
        });
      } else {
        // A raw cell is text the kernel never sees: a plain code block keeps
        // it verbatim.
        const raw = $createCodeNode();
        raw.append($createTextNode(code));
        root.append(raw);
      }
      // Only add paragraph between cells, not after the last cell
      if (index < notebook.cells.length - 1) {
        editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
      }
    });
  });
};

export default nbformatToLexical;
