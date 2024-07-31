/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { CommandRegistry } from '@lumino/commands';
import { CompletionHandler } from '@jupyterlab/completer';
import { CodeCell, MarkdownCell, RawCell } from '@jupyterlab/cells';
import CellAdapter from './CellAdapter';

const cmdIds = {
  invoke: 'completer:invoke',
  select: 'completer:select',
};

export const CellCommands = (
  commandRegistry: CommandRegistry,
  cell: CodeCell | MarkdownCell | RawCell,
  completerHandler: CompletionHandler,
  cellAdapter: CellAdapter,
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
      if (cell instanceof CodeCell) {
        cellAdapter.execute();
      } else if (cell instanceof MarkdownCell) {
        (cell as MarkdownCell).rendered = true;
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
