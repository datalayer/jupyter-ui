/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import type { JSX } from 'react';
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { registerYouTube } from '../extensions/YouTubeExtension';

export { INSERT_YOUTUBE_COMMAND } from '../extensions/YouTubeExtension';

/** `YouTubeExtension` for an editor built with `LexicalComposer`. */
export const YouTubePlugin = (): JSX.Element | null => {
  const [editor] = useLexicalComposerContext();
  useEffect(() => registerYouTube(editor), [editor]);
  return null;
};

export default YouTubePlugin;
