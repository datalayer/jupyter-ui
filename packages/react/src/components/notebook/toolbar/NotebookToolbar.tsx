/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo, useState } from 'react';
import { Toolbar, type ToolbarItem } from '@datalayer/primer-addons';
import {
  PlusIcon,
  PlayIcon,
  SquareFillIcon,
  TrashIcon,
  DownloadIcon,
  IterationsIcon,
  CodeIcon,
  MarkdownIcon,
} from '@primer/octicons-react';
import { useNotebookStore } from '../NotebookState';

/**
 * Keys of the items the notebook toolbar provides.
 *
 * Pass them to `hiddenItems` to leave one out, or reuse them as an anchor
 * when ordering extra items.
 */
export const NOTEBOOK_TOOLBAR_ITEM_KEYS = {
  save: 'notebook-save',
  run: 'notebook-run',
  runAll: 'notebook-run-all',
  interrupt: 'notebook-interrupt',
  delete: 'notebook-delete',
  insert: 'notebook-insert',
  cellType: 'notebook-cell-type',
} as const;

/**
 * Order of the items the notebook toolbar provides.
 *
 * Extra items are ordered on the same scale: below `save` to open the
 * toolbar, above `cellType` to close it, in between to interleave.
 */
export const NOTEBOOK_TOOLBAR_ITEM_ORDERS = {
  save: 100,
  run: 200,
  runAll: 210,
  interrupt: 220,
  delete: 300,
  insert: 400,
  cellType: 410,
} as const;

export type INotebookToolbarProps = {
  /**
   * Notebook the toolbar acts on.
   */
  notebookId: string;
  /**
   * Items added to the ones of the notebook.
   *
   * They are merged with the default items and the whole toolbar is ordered
   * by the `order` of each item, so an extra item can be placed anywhere —
   * see {@link NOTEBOOK_TOOLBAR_ITEM_ORDERS}. A `spacer` item pushes what
   * follows it to the trailing edge.
   */
  extraItems?: ToolbarItem[];
  /**
   * Keys of the default items to leave out, e.g. to replace one of them with
   * an extra item — see {@link NOTEBOOK_TOOLBAR_ITEM_KEYS}.
   */
  hiddenItems?: string[];
  /**
   * Label of the toolbar, for assistive technologies.
   */
  ariaLabel?: string;
};

/**
 * The items a notebook toolbar is made of.
 *
 * Exposed on its own so a host can render them in a toolbar of its own —
 * {@link NotebookToolbar} renders them in the shared Primer toolbar.
 *
 * @param notebookId Notebook the items act on
 */
export function useNotebookToolbarItems(notebookId: string): ToolbarItem[] {
  const notebookStore = useNotebookStore();
  const [insertType, setInsertType] = useState<'code' | 'markdown'>('code');

  const kernelStatus = notebookStore.selectKernelStatus(notebookId);
  const isBusy = kernelStatus === 'busy';
  const isIdle = kernelStatus === 'idle';

  return useMemo(
    (): ToolbarItem[] => [
      {
        key: NOTEBOOK_TOOLBAR_ITEM_KEYS.save,
        type: 'button',
        order: NOTEBOOK_TOOLBAR_ITEM_ORDERS.save,
        group: 'file',
        ariaLabel: 'Save notebook',
        title: 'Save notebook (⌘S)',
        icon: DownloadIcon,
        onClick: () => notebookStore.save({ id: notebookId, date: new Date() }),
      },
      {
        key: 'notebook-divider-file',
        type: 'divider',
        order: NOTEBOOK_TOOLBAR_ITEM_ORDERS.save + 1,
      },
      {
        key: NOTEBOOK_TOOLBAR_ITEM_KEYS.run,
        type: 'button',
        order: NOTEBOOK_TOOLBAR_ITEM_ORDERS.run,
        group: 'run',
        ariaLabel: 'Run cell',
        title: 'Run cell (⇧↵)',
        icon: PlayIcon,
        disabled: !isIdle,
        onClick: () => notebookStore.run(notebookId),
      },
      {
        key: NOTEBOOK_TOOLBAR_ITEM_KEYS.runAll,
        type: 'button',
        order: NOTEBOOK_TOOLBAR_ITEM_ORDERS.runAll,
        group: 'run',
        ariaLabel: 'Run all cells',
        title: 'Run all cells',
        icon: IterationsIcon,
        disabled: !isIdle,
        onClick: () => notebookStore.runAll(notebookId),
      },
      {
        key: NOTEBOOK_TOOLBAR_ITEM_KEYS.interrupt,
        type: 'button',
        order: NOTEBOOK_TOOLBAR_ITEM_ORDERS.interrupt,
        group: 'run',
        ariaLabel: 'Interrupt kernel',
        title: 'Interrupt kernel (⌘I)',
        icon: SquareFillIcon,
        disabled: !isBusy,
        onClick: () => notebookStore.interrupt(notebookId),
      },
      {
        key: 'notebook-divider-run',
        type: 'divider',
        order: NOTEBOOK_TOOLBAR_ITEM_ORDERS.interrupt + 1,
      },
      {
        key: NOTEBOOK_TOOLBAR_ITEM_KEYS.delete,
        type: 'button',
        order: NOTEBOOK_TOOLBAR_ITEM_ORDERS.delete,
        group: 'cell',
        ariaLabel: 'Delete cell',
        title: 'Delete cell',
        icon: TrashIcon,
        onClick: () => notebookStore.delete(notebookId),
      },
      {
        key: NOTEBOOK_TOOLBAR_ITEM_KEYS.insert,
        type: 'button',
        order: NOTEBOOK_TOOLBAR_ITEM_ORDERS.insert,
        group: 'cell',
        ariaLabel: `Insert ${insertType} cell below`,
        title: `Insert ${insertType} cell below`,
        icon: PlusIcon,
        onClick: () => notebookStore.insertBelow(notebookId, insertType),
      },
      {
        key: NOTEBOOK_TOOLBAR_ITEM_KEYS.cellType,
        type: 'dropdown',
        order: NOTEBOOK_TOOLBAR_ITEM_ORDERS.cellType,
        group: 'cell',
        ariaLabel: 'Cell type to insert',
        title: 'Cell type to insert',
        icon: insertType === 'code' ? CodeIcon : MarkdownIcon,
        label: insertType === 'code' ? 'Code' : 'Markdown',
        minWidth: 76,
        options: [
          {
            key: 'code',
            label: 'Code',
            icon: CodeIcon,
            isActive: insertType === 'code',
            onClick: () => setInsertType('code'),
          },
          {
            key: 'markdown',
            label: 'Markdown',
            icon: MarkdownIcon,
            isActive: insertType === 'markdown',
            onClick: () => setInsertType('markdown'),
          },
        ],
      },
    ],
    [insertType, isBusy, isIdle, notebookId, notebookStore]
  );
}

/**
 * The toolbar of a notebook.
 *
 * The items of the notebook itself — save, run, interrupt, cell edition — are
 * rendered in the shared Primer toolbar, along with the `extraItems` a host
 * adds: a kernel indicator, a runtime selector, anything the notebook itself
 * knows nothing about.
 */
export const NotebookToolbar = (props: INotebookToolbarProps) => {
  const {
    notebookId,
    extraItems,
    hiddenItems,
    ariaLabel = 'Notebook toolbar',
  } = props;
  const items = useNotebookToolbarItems(notebookId);
  const visibleItems = useMemo(() => {
    if (!hiddenItems?.length) {
      return items;
    }
    const hidden = new Set(hiddenItems);
    return items.filter(item => !hidden.has(item.key));
  }, [items, hiddenItems]);
  return (
    <Toolbar
      items={visibleItems}
      extraItems={extraItems}
      ariaLabel={ariaLabel}
    />
  );
};

export default NotebookToolbar;
