/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import type { JSX } from 'react';
import 'katex/dist/katex.css';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { LexicalEditor } from 'lexical';
import { useCallback, useEffect } from 'react';

import {
  INSERT_EQUATION_COMMAND,
  registerEquations,
} from '../extensions/EquationsExtension';
import KatexEquationAlterer from '../components/KatexEquationAlterer';

export {
  INSERT_EQUATION_COMMAND,
  type InsertEquationPayload,
} from '../extensions/EquationsExtension';

export function InsertEquationDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const onEquationConfirm = useCallback(
    (equation: string, inline: boolean) => {
      activeEditor.dispatchCommand(INSERT_EQUATION_COMMAND, {
        equation,
        inline,
      });
      onClose();
    },
    [activeEditor, onClose],
  );

  return <KatexEquationAlterer onConfirm={onEquationConfirm} />;
}

/** `EquationsExtension` for an editor built with `LexicalComposer`. */
export const EquationsPlugin = (): JSX.Element | null => {
  const [editor] = useLexicalComposerContext();
  useEffect(() => registerEquations(editor), [editor]);
  return null;
};

export default EquationsPlugin;
