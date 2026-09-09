/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  DEFAULT_LIST_MAX_INDENT_LEVEL,
  registerListMaxIndentLevel,
} from '../extensions/ListMaxIndentLevelExtension';

/** `ListMaxIndentLevelExtension` for an editor built with `LexicalComposer`. */
export const ListMaxIndentLevelPlugin = ({
  maxDepth,
}: {
  maxDepth: number;
}) => {
  const [editor] = useLexicalComposerContext();
  useEffect(
    () =>
      registerListMaxIndentLevel(
        editor,
        maxDepth ?? DEFAULT_LIST_MAX_INDENT_LEVEL,
      ),
    [editor, maxDepth],
  );
  return null;
};

export default ListMaxIndentLevelPlugin;
