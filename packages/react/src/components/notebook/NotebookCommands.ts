/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { CommandRegistry } from '@lumino/commands';
import { DisposableSet } from '@lumino/disposable';
import { SessionContextDialogs } from '@jupyterlab/apputils';
import { CompletionHandler } from '@jupyterlab/completer';
import {
  NotebookActions,
  NotebookPanel,
  NotebookSearchProvider,
  NotebookTracker,
} from '@jupyterlab/notebook';
import {
  SearchDocumentModel,
  SearchDocumentView,
} from '@jupyterlab/documentsearch';
import { Widget } from '@lumino/widgets';
import { nullTranslator } from '@jupyterlab/translation';
import { IYText } from '@jupyter/ydoc';

/**
 * The map of command ids used by the notebook.
 */
export const cmdIds = {
  changeCellType: 'notebook-cell:change-cell-type',
  changeCellTypeToCode: 'notebook-cell:change-cell-to-code',
  changeCellTypeToMarkdown: 'notebook-cell:change-cell-to-markdown',
  changeCellTypeToRaw: 'notebook-cell:change-cell-to-raw',
  commandMode: 'notebook:command-mode',
  deleteCells: 'notebook-cells:delete',
  editMode: 'notebook:edit-mode',
  extendAbove: 'notebook-cells:extend-above',
  extendBelow: 'notebook-cells:extend-below',
  extendBottom: 'notebook-cells:extend-bottom',
  extendTop: 'notebook-cells:extend-top',
  findNext: 'documentsearch:find-next',
  findPrevious: 'documentsearch:find-previous',
  insertAbove: 'notebook-cells:insert-above',
  insertBelow: 'notebook-cells:insert-below',
  interrupt: 'notebook:interrupt-kernel',
  invoke: 'completer:invoke',
  invokeNotebook: 'completer:invoke-notebook',
  merge: 'notebook-cells:merge',
  redo: 'notebook-cells:redo',
  restart: 'notebook:restart-kernel',
  run: 'notebook:run-cell',
  runAll: 'notebook:run-all',
  runAndAdvance: 'notebook-cells:run-and-advance',
  save: 'notebook:save',
  select: 'completer:select',
  selectAbove: 'notebook:move-cursor-up',
  selectBelow: 'notebook:move-cursor-down',
  selectNotebook: 'completer:select-notebook',
  split: 'notebook-cells:split',
  startSearch: 'documentsearch:start-search',
  switchKernel: 'notebook:switch-kernel',
  undo: 'notebook-cells:undo',
};

/**
 * Register notebook commands.
 *
 * @param commandRegistry Command registry
 * @param completerHandler Completion handler
 * @param tracker Notebook tracker
 * @param path Notebook path
 * @returns Commands disposer
 */
export function addNotebookCommands(
  commandRegistry: CommandRegistry,
  completerHandler: CompletionHandler,
  tracker: NotebookTracker,
  path?: string
): DisposableSet {
  const allCommands = new DisposableSet();

  // Add commands.
  if (path) {
    allCommands.add(
      commandRegistry.addCommand(cmdIds.save, {
        label: 'Save',
        execute: () => {
          tracker.currentWidget?.context.save();
        },
      })
    );
    allCommands.add(
      commandRegistry.addKeyBinding({
        selector: '.jp-Notebook',
        keys: ['Accel S'],
        command: cmdIds.save,
      })
    );
  }

  allCommands.add(
    commandRegistry.addCommand(cmdIds.invoke, {
      label: 'Completer: Invoke',
      execute: () => completerHandler.invoke(),
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.select, {
      label: 'Completer: Select',
      execute: () => completerHandler.completer.selectActive(),
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.invokeNotebook, {
      label: 'Invoke Notebook',
      execute: () => {
        if (tracker.currentWidget?.content.activeCell?.model.type === 'code') {
          return commandRegistry.execute(cmdIds.invoke);
        }
      },
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.selectNotebook, {
      label: 'Select Notebook',
      execute: () => {
        if (tracker.currentWidget?.content.activeCell?.model.type === 'code') {
          return commandRegistry.execute(cmdIds.select);
        }
      },
    })
  );
  let searchInstance: SearchDocumentView | undefined;
  allCommands.add(
    commandRegistry.addCommand(cmdIds.startSearch, {
      label: 'Find…',
      execute: () => {
        if (!tracker.currentWidget) {
          searchInstance = undefined;
        } else if (!searchInstance) {
          const provider = new NotebookSearchProvider(
            tracker.currentWidget,
            nullTranslator
          );
          const searchModel = new SearchDocumentModel(provider, 500);
          searchInstance = new SearchDocumentView(searchModel);
          /**
           * Activate the target widget when the search panel is closing
           */
          searchInstance.closed.connect(() => {
            if (!tracker.currentWidget?.isDisposed) {
              tracker.currentWidget?.activate();
            }
          });
          searchInstance.disposed.connect(() => {
            if (!tracker.currentWidget?.isDisposed) {
              tracker.currentWidget?.activate();
            }
            // find next and previous are now disabled
            commandRegistry.notifyCommandChanged();
          });
          /**
           * Dispose resources when the widget is disposed.
           */
          tracker.currentWidget?.disposed.connect(() => {
            searchInstance?.dispose();
            searchModel.dispose();
            provider.dispose();
          });
        }
        if (
          searchInstance &&
          tracker.currentWidget &&
          !searchInstance.isAttached
        ) {
          Widget.attach(searchInstance, tracker.currentWidget?.node);
          searchInstance.node.style.top = `${
            tracker.currentWidget?.toolbar.node.getBoundingClientRect().height +
            tracker.currentWidget?.contentHeader.node.getBoundingClientRect()
              .height
          }px`;
          if (searchInstance.model.searchExpression) {
            searchInstance.model.refresh();
          }
        }
        searchInstance?.focusSearchInput();
      },
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.findNext, {
      label: 'Find Next',
      isEnabled: () => !!searchInstance,
      execute: async () => {
        if (!searchInstance) {
          return;
        }
        await searchInstance.model.highlightNext();
      },
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.findPrevious, {
      label: 'Find Previous',
      isEnabled: () => !!searchInstance,
      execute: async () => {
        if (!searchInstance) {
          return;
        }
        await searchInstance.model.highlightPrevious();
      },
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.interrupt, {
      label: 'Interrupt',
      execute: async () =>
        tracker.currentWidget?.context.sessionContext.session?.kernel?.interrupt(),
    })
  );
  const sessionContextDialogs = new SessionContextDialogs();
  allCommands.add(
    commandRegistry.addCommand(cmdIds.restart, {
      label: 'Restart Kernel',
      execute: () => {
        if (tracker.currentWidget) {
          sessionContextDialogs.restart(
            tracker.currentWidget.context.sessionContext
          );
        }
      },
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.switchKernel, {
      label: 'Switch Kernel',
      execute: () => {
        if (tracker.currentWidget) {
          sessionContextDialogs.selectKernel(
            tracker.currentWidget.context.sessionContext
          );
        }
      },
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.runAndAdvance, {
      label: 'Run and Advance',
      execute: () => {
        return tracker.currentWidget
          ? NotebookActions.runAndAdvance(
              tracker.currentWidget.content,
              tracker.currentWidget.context.sessionContext
            )
          : undefined;
      },
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.run, {
      label: 'Run',
      execute: () => {
        return tracker.currentWidget
          ? NotebookActions.run(
              tracker.currentWidget.content,
              tracker.currentWidget.context.sessionContext
            )
          : undefined;
      },
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.runAll, {
      label: 'Run all',
      execute: () => {
        return tracker.currentWidget
          ? NotebookActions.runAll(
              tracker.currentWidget.content,
              tracker.currentWidget.context.sessionContext
            )
          : undefined;
      },
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.deleteCells, {
      label: 'Delete Cells',
      execute: () => {
        return tracker.currentWidget
          ? NotebookActions.deleteCells(tracker.currentWidget.content)
          : undefined;
      },
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.insertAbove, {
      label: 'Insert Above',
      execute: () => {
        return tracker.currentWidget
          ? NotebookActions.insertAbove(tracker.currentWidget.content)
          : undefined;
      },
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.insertBelow, {
      label: 'Insert Below',
      execute: () => {
        return tracker.currentWidget
          ? NotebookActions.insertBelow(tracker.currentWidget.content)
          : undefined;
      },
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.editMode, {
      label: 'Edit Mode',
      execute: () => {
        if (tracker.currentWidget) {
          tracker.currentWidget.content.mode = 'edit';
        }
      },
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.commandMode, {
      label: 'Command Mode',
      execute: () => {
        if (tracker.currentWidget) {
          tracker.currentWidget.content.mode = 'command';
        }
      },
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.selectBelow, {
      label: 'Select Below',
      execute: () =>
        tracker.currentWidget
          ? NotebookActions.selectBelow(tracker.currentWidget.content)
          : undefined,
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.selectAbove, {
      label: 'Select Above',
      execute: () =>
        tracker.currentWidget
          ? NotebookActions.selectAbove(tracker.currentWidget.content)
          : undefined,
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.extendAbove, {
      label: 'Extend Above',
      execute: () =>
        tracker.currentWidget
          ? NotebookActions.extendSelectionAbove(tracker.currentWidget.content)
          : undefined,
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.extendTop, {
      label: 'Extend to Top',
      execute: () =>
        tracker.currentWidget
          ? NotebookActions.extendSelectionAbove(
              tracker.currentWidget.content,
              true
            )
          : undefined,
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.extendBelow, {
      label: 'Extend Below',
      execute: () =>
        tracker.currentWidget
          ? NotebookActions.extendSelectionBelow(tracker.currentWidget.content)
          : undefined,
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.extendBottom, {
      label: 'Extend to Bottom',
      execute: () =>
        tracker.currentWidget
          ? NotebookActions.extendSelectionBelow(
              tracker.currentWidget.content,
              true
            )
          : undefined,
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.merge, {
      label: 'Merge Cells',
      execute: () =>
        tracker.currentWidget
          ? NotebookActions.mergeCells(tracker.currentWidget.content)
          : undefined,
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.split, {
      label: 'Split Cell',
      execute: () =>
        tracker.currentWidget
          ? NotebookActions.splitCell(tracker.currentWidget.content)
          : undefined,
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.undo, {
      label: 'Undo',
      execute: () => {
        const activeCell = tracker.currentWidget?.content.activeCell;
        if (activeCell) {
          const sharedModel = activeCell.model.sharedModel as any as IYText;
          if (sharedModel.undoManager) {
            sharedModel.undoManager.undo();
          } else {
            // Fallback to default undo if Yjs undo manager is not available
            NotebookActions.undo(tracker.currentWidget.content);
          }
        }
      },
    })
  );

  allCommands.add(
    commandRegistry.addCommand(cmdIds.redo, {
      label: 'Redo',
      execute: () => {
        const activeCell = tracker.currentWidget?.content.activeCell;
        if (activeCell) {
          const sharedModel = activeCell.model.sharedModel as any as IYText;
          if (sharedModel.undoManager) {
            sharedModel.undoManager.redo();
          } else {
            // Fallback to default redo if Yjs undo manager is not available
            NotebookActions.redo(tracker.currentWidget.content);
          }
        }
      },
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.changeCellTypeToCode, {
      label: 'Change Cell Type to Code',
      execute: args =>
        tracker.currentWidget
          ? NotebookActions.changeCellType(
              tracker.currentWidget.content,
              'code'
            )
          : undefined,
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.changeCellTypeToMarkdown, {
      label: 'Change Cell Type to Markdown',
      execute: args =>
        tracker.currentWidget
          ? NotebookActions.changeCellType(
              tracker.currentWidget.content,
              'markdown'
            )
          : undefined,
    })
  );
  allCommands.add(
    commandRegistry.addCommand(cmdIds.changeCellTypeToRaw, {
      label: 'Change Cell Type to Raw',
      execute: args =>
        tracker.currentWidget
          ? NotebookActions.changeCellType(tracker.currentWidget.content, 'raw')
          : undefined,
    })
  );

  function getCurrent(args: ReadonlyPartialJSONObject): NotebookPanel | null {
    return tracker.currentWidget;
  }
  function isEnabled(): boolean {
    return tracker.currentWidget !== null;
  }
  allCommands.add(
    commandRegistry.addCommand('run-selected-codecell', {
      label: 'Run Cell',
      execute: args => {
        const current = getCurrent(args);
        if (current) {
          const { context, content } = current;
          NotebookActions.run(content, context.sessionContext);
        }
      },
      isEnabled,
    })
  );

  const bindings = [
    {
      selector: '.jp-Notebook.jp-mod-editMode .jp-mod-completer-enabled',
      keys: ['Tab'],
      command: cmdIds.invokeNotebook,
    },
    {
      selector: '.jp-mod-completer-active',
      keys: ['Enter'],
      command: cmdIds.selectNotebook,
    },
    {
      selector: '.jp-Notebook',
      keys: ['Ctrl Enter'],
      command: cmdIds.run,
    },
    {
      selector: '.jp-Notebook',
      keys: ['Shift Enter'],
      command: cmdIds.runAndAdvance,
    },
    {
      selector: '.jp-Notebook',
      keys: ['Accel F'],
      command: cmdIds.startSearch,
    },
    {
      selector: '.jp-Notebook:focus',
      keys: ['D', 'D'],
      command: cmdIds.deleteCells,
    },
    {
      selector: '.jp-Notebook',
      keys: ['Accel G'],
      command: cmdIds.findNext,
    },
    {
      selector: '.jp-Notebook',
      keys: ['Accel Shift G'],
      command: cmdIds.findPrevious,
    },
    {
      selector: '.jp-Notebook.jp-mod-commandMode :focus:not(:read-write)',
      keys: ['I', 'I'],
      command: cmdIds.interrupt,
    },
    {
      selector: '.jp-Notebook.jp-mod-commandMode :focus:not(:read-write)',
      keys: ['0', '0'],
      command: cmdIds.restart,
    },
    {
      selector: '.jp-Notebook.jp-mod-commandMode :focus:not(:read-write)',
      keys: ['Enter'],
      command: cmdIds.editMode,
    },
    {
      selector: '.jp-Notebook.jp-mod-editMode',
      keys: ['Escape'],
      command: cmdIds.commandMode,
    },
    {
      selector: '.jp-Notebook.jp-mod-commandMode :focus:not(:read-write)',
      keys: ['Shift M'],
      command: cmdIds.merge,
    },
    {
      selector: '.jp-Notebook.jp-mod-editMode',
      keys: ['Ctrl Shift -'],
      command: cmdIds.split,
    },
    {
      selector: '.jp-Notebook.jp-mod-commandMode :focus:not(:read-write)',
      keys: ['J'],
      command: cmdIds.selectBelow,
    },
    {
      selector: '.jp-Notebook.jp-mod-commandMode :focus:not(:read-write)',
      keys: ['ArrowDown'],
      command: cmdIds.selectBelow,
    },
    {
      selector: '.jp-Notebook.jp-mod-commandMode :focus:not(:read-write)',
      keys: ['A'],
      command: cmdIds.insertAbove,
    },
    {
      selector: '.jp-Notebook.jp-mod-commandMode :focus:not(:read-write)',
      keys: ['B'],
      command: cmdIds.insertBelow,
    },
    {
      selector: '.jp-Notebook.jp-mod-commandMode :focus:not(:read-write)',
      keys: ['K'],
      command: cmdIds.selectAbove,
    },
    {
      selector: '.jp-Notebook.jp-mod-commandMode :focus:not(:read-write)',
      keys: ['ArrowUp'],
      command: cmdIds.selectAbove,
    },
    {
      selector: '.jp-Notebook.jp-mod-commandMode :focus:not(:read-write)',
      keys: ['Shift K'],
      command: cmdIds.extendAbove,
    },
    {
      selector: '.jp-Notebook.jp-mod-commandMode :focus:not(:read-write)',
      keys: ['Shift J'],
      command: cmdIds.extendBelow,
    },
    {
      selector: '.jp-Notebook',
      keys: ['Ctrl Z'],
      command: cmdIds.undo,
    },
    {
      selector: '.jp-Notebook',
      keys: ['Ctrl Y'],
      command: cmdIds.redo,
    },
    {
      selector: '.jp-Notebook:focus',
      keys: ['M'],
      command: cmdIds.changeCellTypeToMarkdown,
    },
    {
      selector: '.jp-Notebook:focus',
      keys: ['R'],
      command: cmdIds.changeCellTypeToRaw,
    },
    {
      selector: '.jp-Notebook:focus',
      keys: ['Y'],
      command: cmdIds.changeCellTypeToCode,
    },
  ];
  bindings.forEach(binding =>
    allCommands.add(commandRegistry.addKeyBinding(binding))
  );

  return allCommands;
}

export default addNotebookCommands;
