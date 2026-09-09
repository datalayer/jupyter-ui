/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Embedded YouTube videos, as a Lexical extension.
 *
 * Registers `YouTubeNode` and answers `INSERT_YOUTUBE_COMMAND` (payload: the
 * video id) by inserting one at the nearest root.
 *
 * @module extensions/YouTubeExtension
 */

import { $insertNodeToNearestRoot } from '@lexical/utils';
import {
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  defineExtension,
  type LexicalCommand,
  type LexicalEditor,
} from 'lexical';
import { $createYouTubeNode, YouTubeNode } from '../nodes/YouTubeNode';

export const INSERT_YOUTUBE_COMMAND: LexicalCommand<string> = createCommand();

/**
 * Handle `INSERT_YOUTUBE_COMMAND` on `editor`.
 *
 * @returns The function that removes the handler again.
 */
export function registerYouTube(editor: LexicalEditor): () => void {
  if (!editor.hasNodes([YouTubeNode])) {
    throw new Error('YouTubePlugin: YouTubeNode not registered on editor');
  }
  return editor.registerCommand<string>(
    INSERT_YOUTUBE_COMMAND,
    payload => {
      const youTubeNode = $createYouTubeNode(payload);
      $insertNodeToNearestRoot(youTubeNode);
      return true;
    },
    COMMAND_PRIORITY_EDITOR,
  );
}

export const YouTubeExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/YouTube',
  nodes: () => [YouTubeNode],
  register: registerYouTube,
});
