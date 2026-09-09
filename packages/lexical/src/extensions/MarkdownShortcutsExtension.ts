/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Markdown shortcuts while typing, as a Lexical extension.
 *
 * Registers `@lexical/markdown`'s shortcuts with this package's transformers:
 * the playground set plus horizontal rules, images, equations, tables and
 * Jupyter cells. Another set can be given through the config:
 *
 * ```ts
 * configExtension(MarkdownShortcutsExtension, { transformers: TRANSFORMERS })
 * ```
 *
 * The nodes the common transformers need come with the extension. A
 * transformer whose nodes the editor does not have — a document without
 * Jupyter cells, say — is left out rather than refused, so the shortcuts
 * follow what the editor can hold.
 *
 * @module extensions/MarkdownShortcutsExtension
 */

import { CodeExtension } from '@lexical/code';
import { LinkExtension } from '@lexical/link';
import { ListExtension } from '@lexical/list';
import { registerMarkdownShortcuts, type Transformer } from '@lexical/markdown';
import { RichTextExtension } from '@lexical/rich-text';
import { TableExtension as LexicalTableExtension } from '@lexical/table';
import { defineExtension, safeCast, type LexicalEditor } from 'lexical';
import { PLAYGROUND_TRANSFORMERS } from '../convert/transformers/MarkdownTransformers';
import { EquationsExtension } from './EquationsExtension';
import { HorizontalRuleExtension } from './HorizontalRuleExtension';
import { ImagesExtension } from './ImagesExtension';

export interface MarkdownShortcutsConfig {
  /** The transformers the shortcuts apply. */
  transformers: Transformer[];
}

/** The transformers of `transformers` whose nodes `editor` has. */
export function supportedTransformers(
  editor: LexicalEditor,
  transformers: Transformer[],
): Transformer[] {
  return transformers.filter(transformer => {
    const dependencies =
      'dependencies' in transformer ? transformer.dependencies : [];
    return editor.hasNodes(dependencies);
  });
}

export const MarkdownShortcutsExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/MarkdownShortcuts',
  config: safeCast<MarkdownShortcutsConfig>({
    transformers: PLAYGROUND_TRANSFORMERS,
  }),
  dependencies: [
    RichTextExtension,
    ListExtension,
    LinkExtension,
    CodeExtension,
    LexicalTableExtension,
    HorizontalRuleExtension,
    ImagesExtension,
    EquationsExtension,
  ],
  register: (editor, { transformers }) =>
    registerMarkdownShortcuts(
      editor,
      supportedTransformers(editor, transformers),
    ),
});
