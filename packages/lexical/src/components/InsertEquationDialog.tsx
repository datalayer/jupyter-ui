import { useCallback } from "react";
import { LexicalEditor } from "lexical";
import { KatexEquationAlterer } from './../ui/KatexEquationAlterer';
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
