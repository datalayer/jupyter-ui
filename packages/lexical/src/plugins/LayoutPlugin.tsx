/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { registerLayout } from '../extensions/LayoutExtension';

export {
  INSERT_LAYOUT_COMMAND,
  equalColumnsTemplate,
  getItemsCountFromTemplate,
} from '../extensions/LayoutExtension';

/** `LayoutExtension` for an editor built with `LexicalComposer`. */
export function LayoutPlugin(): null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => registerLayout(editor), [editor]);
  return null;
}

export default LayoutPlugin;
