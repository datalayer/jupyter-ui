/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

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

export function TablePlugin(): JSX.Element {
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

  return (
    <>
      <LexicalTablePlugin />
      {isModalOpen && (
        <TableInsertModal onConfirm={handleConfirm} onClose={handleClose} />
      )}
    </>
  );
}

export default TablePlugin;
