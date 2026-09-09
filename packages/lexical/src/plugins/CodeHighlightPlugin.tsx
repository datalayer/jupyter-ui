/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Syntax highlighting and line numbers for regular code blocks (CodeNode),
 * for an editor built with `LexicalComposer`. The behaviour itself is
 * `registerCodeBlockHighlight` in `CodeBlockHighlightExtension`.
 *
 * Note: JupyterInputNode has its own highlighting via JupyterInputHighlighter.
 * This plugin only affects regular code blocks (type: "code").
 */

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { registerCodeBlockHighlight } from '../extensions/CodeBlockHighlightExtension';

export function CodeBlockHighlightPlugin(): null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => registerCodeBlockHighlight(editor), [editor]);
  return null;
}
