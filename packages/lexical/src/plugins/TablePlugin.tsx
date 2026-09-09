/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import type { JSX } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { TablePlugin as LexicalTablePlugin } from '@lexical/react/LexicalTablePlugin';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import {
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
} from 'lexical';
import { useEffect, useState } from 'react';

import TableInsertModal from '../components/TableInsertModal';

export const INSERT_TABLE_WITH_DIALOG_COMMAND: LexicalCommand<void> =
  createCommand();

/**
 * The dialog behind `INSERT_TABLE_WITH_DIALOG_COMMAND`: asks for rows and
 * columns, then dispatches `INSERT_TABLE_COMMAND`. Table support itself
 * comes from elsewhere — `TableExtension` or `TablePlugin`.
 */
export function TableInsertDialogPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [isModalOpen, setModalOpen] = useState<boolean>(false);

  useEffect(() => {
    return editor.registerCommand(
      INSERT_TABLE_WITH_DIALOG_COMMAND,
      () => {
        setModalOpen(true);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  const handleConfirm = (rows: number, columns: number) => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, {
      rows: rows.toString(),
      columns: columns.toString(),
    });
    setModalOpen(false);
  };

  const handleClose = () => {
    setModalOpen(false);
  };

  return isModalOpen ? (
    <TableInsertModal onConfirm={handleConfirm} onClose={handleClose} />
  ) : null;
}

/** `TableExtension` for an editor built with `LexicalComposer`. */
export function TablePlugin(): JSX.Element {
  return (
    <>
      <LexicalTablePlugin />
      <TableInsertDialogPlugin />
    </>
  );
}

export default TablePlugin;
