/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The self-contained Jupyter cell, as a Lexical extension.
 *
 * Registers `JupyterCellNode` and answers `INSERT_JUPYTER_CELL_COMMAND` by
 * inserting one at the selection.
 *
 * @module extensions/JupyterCellExtension
 */

import {
  $insertNodes,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  defineExtension,
  type LexicalEditor,
} from 'lexical';
import type { IOutput } from '@jupyterlab/nbformat';
import {
  $createJupyterCellNode,
  JupyterCellNode,
} from '../nodes/JupyterCellNode';

export type JupyterCellProps = {
  code: string;
  outputs: IOutput[];
  loading: string;
  autoStart: boolean;
};

export const INSERT_JUPYTER_CELL_COMMAND = createCommand<JupyterCellProps>();

/**
 * Handle `INSERT_JUPYTER_CELL_COMMAND` on `editor`.
 *
 * @returns The function that removes the handler again.
 */
export function registerJupyterCell(editor: LexicalEditor): () => void {
  if (!editor.hasNodes([JupyterCellNode])) {
    throw new Error('JupyterCellNode is not registered.');
  }
  return editor.registerCommand(
    INSERT_JUPYTER_CELL_COMMAND,
    (props: JupyterCellProps) => {
      const jupyterNode = $createJupyterCellNode(props);
      $insertNodes([jupyterNode]);
      return true;
    },
    COMMAND_PRIORITY_EDITOR,
  );
}

export const JupyterCellExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/JupyterCell',
  nodes: () => [JupyterCellNode],
  register: registerJupyterCell,
});
