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
import type { JupyterVariant } from '@datalayer/jupyter-react';
import { mergeRegister } from '@lexical/utils';
import {
  $createJupyterCellNode,
  JupyterCellNode,
} from '../nodes/JupyterCellNode';

export type JupyterCellProps = {
  code: string;
  outputs: IOutput[];
  loading: string;
  autoStart: boolean;
  /** `marimo` for a reactive cell; unset means the kernel's own variant. */
  variant?: JupyterVariant;
};

export const INSERT_JUPYTER_CELL_COMMAND = createCommand<JupyterCellProps>();

/**
 * Insert a Marimo cell: a Jupyter cell whose variant is `marimo`, reactive
 * on the kernel it shares with the document's other Marimo cells.
 */
export const INSERT_MARIMO_CELL_COMMAND =
  createCommand<Omit<JupyterCellProps, 'variant'>>();

/**
 * Handle `INSERT_JUPYTER_CELL_COMMAND` on `editor`.
 *
 * @returns The function that removes the handler again.
 */
export function registerJupyterCell(editor: LexicalEditor): () => void {
  if (!editor.hasNodes([JupyterCellNode])) {
    throw new Error('JupyterCellNode is not registered.');
  }
  return mergeRegister(
    editor.registerCommand(
      INSERT_JUPYTER_CELL_COMMAND,
      (props: JupyterCellProps) => {
        const jupyterNode = $createJupyterCellNode(props);
        $insertNodes([jupyterNode]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    ),
    editor.registerCommand(
      INSERT_MARIMO_CELL_COMMAND,
      props => {
        const marimoNode = $createJupyterCellNode({
          ...props,
          variant: 'marimo',
        });
        $insertNodes([marimoNode]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    ),
  );
}

export const JupyterCellExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/JupyterCell',
  nodes: () => [JupyterCellNode],
  register: registerJupyterCell,
});
