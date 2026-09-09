/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { registerJupyterCell } from '../extensions/JupyterCellExtension';

import '@jupyterlab/theme-light-extension/style/variables.css';

export {
  INSERT_JUPYTER_CELL_COMMAND,
  type JupyterCellProps,
} from '../extensions/JupyterCellExtension';

/** `JupyterCellExtension` for an editor built with `LexicalComposer`. */
export function JupyterCellPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => registerJupyterCell(editor), [editor]);
  return null;
}

export default JupyterCellPlugin;
