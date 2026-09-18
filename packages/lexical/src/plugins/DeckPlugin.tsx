/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import type { JSX } from 'react';
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { registerDeck } from '../extensions/DeckExtension';

export { INSERT_DECK_COMMAND } from '../extensions/DeckExtension';

/** `DeckExtension` for an editor built with `LexicalComposer`. */
export const DeckPlugin = (): JSX.Element | null => {
  const [editor] = useLexicalComposerContext();
  useEffect(() => registerDeck(editor), [editor]);
  return null;
};

export default DeckPlugin;
