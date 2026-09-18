/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Everything a Jupyter Lexical document is made of, as one extension.
 *
 * Rich text, history, lists and check lists, links and automatic links,
 * hashtags, tables, horizontal rules, highlighted code blocks, markdown
 * shortcuts, images, equations, YouTube and Loom videos, videos recorded in
 * the page, collapsibles, drawings, decks,
 * comment anchors, Jupyter cells, executable inputs with their outputs,
 * columns, execution trees, the four PDF exports, the `/` picker, inline
 * completions and the
 * editor's place in the shared store.
 * A host depends on it from its root extension and adds what is its own —
 * the namespace, a theme, an initial state, whether to focus on mount:
 *
 * ```tsx
 * const extension = defineExtension({
 *   name: '[root]',
 *   namespace: 'my-document',
 *   theme: commentTheme,
 *   dependencies: [JupyterLexicalExtension, AutoFocusExtension],
 * });
 * <LexicalExtensionComposer extension={extension} contentEditable={null}>
 *   <ContentEditable />
 * </LexicalExtensionComposer>
 * ```
 *
 * Bundled behaviours can be reconfigured from the root through
 * `configExtension` — `configExtension(HistoryExtension, { disabled: true })`
 * for a collaborative document, for instance — and the components that
 * need what only the host has (a kernel, completion providers) are output
 * components the host places: see `JupyterInputOutputExtension`,
 * `ComponentPickerMenuExtension` and `InlineCompletionExtension`.
 *
 * No theme is set here: the class names are the host's choice, and
 * `commentTheme` is the one this package's stylesheet styles.
 *
 * @module extensions/JupyterLexicalExtension
 */

import { HashtagExtension } from '@lexical/hashtag';
import { HistoryExtension } from '@lexical/history';
import { LinkExtension } from '@lexical/link';
import { CheckListExtension, ListExtension } from '@lexical/list';
import { RichTextExtension } from '@lexical/rich-text';
import { defineExtension } from 'lexical';
import { CounterNode } from '../nodes/CounterNode';
import { AutoEmbedExtension } from './AutoEmbedExtension';
import { AutoLinkExtension } from './AutoLinkExtension';
import { CodeBlockHighlightExtension } from './CodeBlockHighlightExtension';
import { CollapsibleExtension } from './CollapsibleExtension';
import { CommentExtension } from './CommentExtension';
import { ComponentPickerMenuExtension } from './ComponentPickerMenuExtension';
import { DeckExtension } from './DeckExtension';
import { EquationsExtension } from './EquationsExtension';
import { ExcalidrawExtension } from './ExcalidrawExtension';
import { ExecutionTreeExtension } from './ExecutionTreeExtension';
import { HorizontalRuleExtension } from './HorizontalRuleExtension';
import { ImagesExtension } from './ImagesExtension';
import { InlineCompletionExtension } from './InlineCompletionExtension';
import { JupyterCellExtension } from './JupyterCellExtension';
import { JupyterInputOutputExtension } from './JupyterInputOutputExtension';
import { LayoutExtension } from './LayoutExtension';
import { LexicalStateExtension } from './LexicalStateExtension';
import { ListMaxIndentLevelExtension } from './ListMaxIndentLevelExtension';
import { LoomExtension } from './LoomExtension';
import { MarkdownShortcutsExtension } from './MarkdownShortcutsExtension';
import { PdfExportExtension } from './PdfExportExtension';
import { TableExtension } from './TableExtension';
import { VideoExtension } from './VideoExtension';
import { YouTubeExtension } from './YouTubeExtension';

export const JupyterLexicalExtension = defineExtension({
  name: '@datalayer/jupyter-lexical',
  nodes: () => [CounterNode],
  dependencies: [
    RichTextExtension,
    HistoryExtension,
    ListExtension,
    CheckListExtension,
    LinkExtension,
    AutoLinkExtension,
    HashtagExtension,
    TableExtension,
    HorizontalRuleExtension,
    CodeBlockHighlightExtension,
    ListMaxIndentLevelExtension,
    MarkdownShortcutsExtension,
    ImagesExtension,
    EquationsExtension,
    YouTubeExtension,
    LoomExtension,
    VideoExtension,
    CollapsibleExtension,
    ExcalidrawExtension,
    DeckExtension,
    ExecutionTreeExtension,
    AutoEmbedExtension,
    CommentExtension,
    JupyterCellExtension,
    JupyterInputOutputExtension,
    LayoutExtension,
    PdfExportExtension,
    ComponentPickerMenuExtension,
    InlineCompletionExtension,
    LexicalStateExtension,
  ],
});
