/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useCallback } from "react";
import { LexicalEditor } from "lexical";
import { KatexEquationAlterer } from './../components/KatexEquationAlterer';
import { INSERT_EQUATION_COMMAND } from './../plugins/EquationsPlugin';

export function InsertEquationDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const onEquationConfirm = useCallback(
    (equation: string, inline: boolean) => {
      activeEditor.dispatchCommand(INSERT_EQUATION_COMMAND, {equation, inline});
      onClose();
    },
    [activeEditor, onClose],
  );
  return <KatexEquationAlterer onConfirm={onEquationConfirm} />;
}
