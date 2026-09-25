/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import type { JSX } from 'react';
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { registerLoom } from '../extensions/LoomExtension';
import { setLoomPublicAppId } from '../utils/loom';

export { INSERT_LOOM_COMMAND } from '../extensions/LoomExtension';

/**
 * `LoomExtension` for an editor built with `LexicalComposer`, where the
 * Loom public app id comes as a prop rather than as the extension's config.
 */
export const LoomPlugin = ({
  publicAppId,
}: {
  publicAppId?: string;
}): JSX.Element | null => {
  const [editor] = useLexicalComposerContext();
  useEffect(() => registerLoom(editor), [editor]);
  useEffect(
    () => setLoomPublicAppId(editor, publicAppId),
    [editor, publicAppId],
  );
  return null;
};

export default LoomPlugin;
