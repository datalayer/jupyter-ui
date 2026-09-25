/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Decks, as a Lexical extension.
 *
 * Registers `DeckNode` and answers `INSERT_DECK_COMMAND` (payload: a
 * `DeckSpec`, or nothing for a deck of one title slide) by inserting one at
 * the nearest root. Double-clicking the block edits its specification.
 *
 * @module extensions/DeckExtension
 */

import type { DeckSpec } from '@datalayer/decks';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import {
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  defineExtension,
  type LexicalCommand,
  type LexicalEditor,
} from 'lexical';
import { $createDeckNode, DeckNode } from '../nodes/DeckNode';

/** Insert a deck block: `spec`, or one title slide when none is given. */
export const INSERT_DECK_COMMAND: LexicalCommand<DeckSpec | undefined> =
  createCommand('INSERT_DECK_COMMAND');

/**
 * Handle `INSERT_DECK_COMMAND` on `editor`.
 *
 * @returns The function that removes the handler again.
 */
export function registerDeck(editor: LexicalEditor): () => void {
  if (!editor.hasNodes([DeckNode])) {
    throw new Error('DeckExtension: DeckNode not registered on editor');
  }
  return editor.registerCommand<DeckSpec | undefined>(
    INSERT_DECK_COMMAND,
    spec => {
      $insertNodeToNearestRoot($createDeckNode(spec));
      return true;
    },
    COMMAND_PRIORITY_EDITOR,
  );
}

export const DeckExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/Deck',
  nodes: () => [DeckNode],
  register: registerDeck,
});
