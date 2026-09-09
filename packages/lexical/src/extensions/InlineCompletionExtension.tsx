/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Ghost-text inline completions, as a Lexical extension.
 *
 * Registers `InlineCompletionNode`. The completions themselves come from the
 * providers a host wires up, so `LexicalInlineCompletionPlugin` is the
 * extension's output component, placed by the host with its providers:
 *
 * ```tsx
 * const InlineCompletion = useExtensionComponent(InlineCompletionExtension);
 * return <InlineCompletion providers={providers} />;
 * ```
 *
 * @module extensions/InlineCompletionExtension
 */

import { ReactExtension } from '@lexical/react/ReactExtension';
import { defineExtension } from 'lexical';
import { InlineCompletionNode } from '../nodes/InlineCompletionNode';
import { LexicalInlineCompletionPlugin } from '../plugins/LexicalInlineCompletionPlugin';

export const InlineCompletionExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/InlineCompletion',
  nodes: () => [InlineCompletionNode],
  dependencies: [ReactExtension],
  build: () => ({ Component: LexicalInlineCompletionPlugin }),
});
