/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Loom videos, as a Lexical extension.
 *
 * Registers `LoomNode` and answers `INSERT_LOOM_COMMAND`: with a video, a
 * block showing it; without one, an empty block offering to record a video
 * or to take the address of one.
 *
 * Recording needs a Loom public app id, which is the host's to give — this
 * package is public and keeps none:
 *
 * ```ts
 * configExtension(LoomExtension, { publicAppId: process.env.LOOM_PUBLIC_APP_ID })
 * ```
 *
 * Without one the blocks still show videos and embed addresses; only Record
 * is unavailable. See `utils/loom` for the React 18 the recorder needs.
 *
 * @module extensions/LoomExtension
 */

import { $insertNodeToNearestRoot } from '@lexical/utils';
import {
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  defineExtension,
  safeCast,
  type LexicalCommand,
  type LexicalEditor,
} from 'lexical';
import { $createLoomNode, LoomNode } from '../nodes/LoomNode';
import { LOOM_EXTENSION_NAME, type LoomVideoData } from '../utils/loom';

export interface LoomConfig {
  /**
   * The Loom public app id recording runs under. Absent, the blocks show
   * and embed videos but cannot record them.
   */
  publicAppId: string | undefined;
}

/** Insert a Loom block: showing the video given, or waiting for one. */
export const INSERT_LOOM_COMMAND: LexicalCommand<LoomVideoData | undefined> =
  createCommand('INSERT_LOOM_COMMAND');

/**
 * Handle `INSERT_LOOM_COMMAND` on `editor`.
 *
 * @returns The function that removes the handler again.
 */
export function registerLoom(editor: LexicalEditor): () => void {
  if (!editor.hasNodes([LoomNode])) {
    throw new Error('LoomExtension: LoomNode not registered on editor');
  }
  return editor.registerCommand<LoomVideoData | undefined>(
    INSERT_LOOM_COMMAND,
    video => {
      $insertNodeToNearestRoot($createLoomNode(video));
      return true;
    },
    COMMAND_PRIORITY_EDITOR,
  );
}

export const LoomExtension = defineExtension({
  name: LOOM_EXTENSION_NAME,
  config: safeCast<LoomConfig>({ publicAppId: undefined }),
  nodes: () => [LoomNode],
  register: registerLoom,
});
