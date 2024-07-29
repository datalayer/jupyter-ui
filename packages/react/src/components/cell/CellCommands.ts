/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { CommandRegistry } from '@lumino/commands';
import { CompletionHandler } from '@jupyterlab/completer';
import { CodeCell, MarkdownCell, RawCell } from '@jupyterlab/cells';
import { SessionContext } from '@jupyterlab/apputils';
import { cellStore } from './CellState';

const cmdIds = {
  invoke: 'completer:invoke',
  select: 'completer:select',
};

export const CellCommands = (
  cellId: string,
  commandRegistry: CommandRegistry,
  cell: CodeCell | MarkdownCell | RawCell,
  sessionContext: SessionContext,
  completerHandler: CompletionHandler
): void => {
  commandRegistry.addCommand(cmdIds.invoke, {
    label: 'Completer: Invoke',
    execute: () => completerHandler.invoke(),
  });
  commandRegistry.addCommand(cmdIds.select, {
    label: 'Completer: Select',
    execute: () => completerHandler.completer.selectActive(),
  });
  commandRegistry.addCommand('run:cell', {
    execute: () => {
      cellStore.getState().setIsExecuting(cellId, true);
      if (cell instanceof CodeCell) {
        CodeCell
          .execute(cell, sessionContext)
          .then(() => {
            cellStore.getState().setIsExecuting(cellId, false);
          })
      } else if (cell instanceof MarkdownCell) {
        (cell as MarkdownCell).rendered = true;
        cellStore.getState().setIsExecuting(cellId, false);
      }
    },
  });
  commandRegistry.addKeyBinding({
    selector: '.jp-InputArea-editor.jp-mod-completer-enabled',
    keys: ['Tab'],
    command: cmdIds.invoke,
  });
  commandRegistry.addKeyBinding({
    selector: '.jp-InputArea-editor',
    keys: ['Shift Enter'],
    command: 'run:cell',
  });
  const bindings = [
    {
      selector: '.jp-InputArea-editor.jp-mod-completer-active',
      keys: ['Enter'],
      command: cmdIds.select,
    },
  ];
  bindings.map(binding => commandRegistry.addKeyBinding(binding));
};

export default CellCommands;
