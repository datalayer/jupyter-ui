/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The nodes comment threads are anchored to, as a Lexical extension.
 *
 * `CommentThreadNode` and, through `@lexical/mark`, the `MarkNode` that
 * highlights the commented text. The commenting UI itself is `CommentPlugin`,
 * which needs a `CommentsProvider` above it and so stays a React plug-in.
 *
 * @module extensions/CommentExtension
 */

import { MarkExtension } from '@lexical/mark';
import { defineExtension } from 'lexical';
import { CommentThreadNode } from '../nodes/CommentThreadNode';

export const CommentExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/Comment',
  dependencies: [MarkExtension],
  nodes: () => [CommentThreadNode],
});
