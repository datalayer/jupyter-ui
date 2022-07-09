import { CommandRegistry } from "@lumino/commands";
import { CompletionHandler } from "@jupyterlab/completer";
import { CodeCell } from '@jupyterlab/cells';
import { SessionContext } from '@jupyterlab/apputils';

const cmdIds = {
  invoke: "completer:invoke",
  select: "completer:select",
};

export const CellCommands = (
  commandRegistry: CommandRegistry,
  codeCell: CodeCell,
  sessionContext: SessionContext,
  completerHandler: CompletionHandler
): void => {
  commandRegistry.addCommand(cmdIds.invoke, {
    label: "Completer: Invoke",
    execute: () => completerHandler.invoke(),
  });
  commandRegistry.addCommand(cmdIds.select, {
    label: "Completer: Select",
    execute: () => completerHandler.completer.selectActive(),
  });
  commandRegistry.addCommand('run:cell', {
    execute: () => CodeCell.execute(codeCell, sessionContext)
  });
  commandRegistry.addKeyBinding({
    selector: '.jp-InputArea-editor.jp-mod-completer-enabled',
    keys: ['Tab'],
    command: cmdIds.invoke
  });
  commandRegistry.addKeyBinding({
    selector: '.jp-InputArea-editor',
    keys: ['Shift Enter'],
    command: 'run:cell'
  });
  const bindings = [
    {
      selector: `.jp-InputArea-editor.jp-mod-completer-active`,
      keys: ["Enter"],
      command: cmdIds.select,
    },
  ];
  bindings.map((binding) => commandRegistry.addKeyBinding(binding));
};

export default CellCommands;
