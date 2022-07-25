/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {MarkdownShortcutPlugin} from '@lexical/react/LexicalMarkdownShortcutPlugin';

import {PLAYGROUND_TRANSFORMERS} from '../convert/transformers/MarkdownTransformers';

export const MarkdownPlugin = (): JSX.Element => {
  return <MarkdownShortcutPlugin transformers={PLAYGROUND_TRANSFORMERS} />;
}

export default MarkdownPlugin;
