/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import {MarkdownShortcutPlugin} from '@lexical/react/LexicalMarkdownShortcutPlugin';

import {PLAYGROUND_TRANSFORMERS} from '../convert/transformers/MarkdownTransformers';

export const MarkdownPlugin = (): JSX.Element => {
  return <MarkdownShortcutPlugin transformers={PLAYGROUND_TRANSFORMERS} />;
}

export default MarkdownPlugin;
