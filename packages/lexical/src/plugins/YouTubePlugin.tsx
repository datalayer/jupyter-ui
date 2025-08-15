/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import {
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
} from 'lexical';
import { useEffect } from 'react';

import { $createYouTubeNode, YouTubeNode } from '../nodes/YouTubeNode';

export const INSERT_YOUTUBE_COMMAND: LexicalCommand<string> = createCommand();

export const YouTubePlugin = (): JSX.Element | null => {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
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
  }, [editor]);
  return null;
};

export default YouTubePlugin;
