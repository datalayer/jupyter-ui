/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { registerHorizontalRule } from '../extensions/HorizontalRuleExtension';

/** `HorizontalRuleExtension` for an editor built with `LexicalComposer`. */
export const HorizontalRulePlugin = (): null => {
  const [editor] = useLexicalComposerContext();
  useEffect(() => registerHorizontalRule(editor), [editor]);
  return null;
};

export default HorizontalRulePlugin;
