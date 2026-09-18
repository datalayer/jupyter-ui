/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import type { JSX } from 'react';
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { registerVideo } from '../extensions/VideoExtension';

export { INSERT_VIDEO_COMMAND } from '../extensions/VideoExtension';

/** `VideoExtension` for an editor built with `LexicalComposer`. */
export const VideoPlugin = (): JSX.Element | null => {
  const [editor] = useLexicalComposerContext();
  useEffect(() => registerVideo(editor), [editor]);
  return null;
};

export default VideoPlugin;
