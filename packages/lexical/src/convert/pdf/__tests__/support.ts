/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/** Editors for the exporter tests: every node, filled from LaTeX or Markdown. */

import { createHeadlessEditor } from '@lexical/headless';
import type { LexicalEditor } from 'lexical';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { EquationNode } from '../../../nodes/EquationNode';
import { ImageNode } from '../../../nodes/ImageNode';
import { YouTubeNode } from '../../../nodes/YouTubeNode';
import { JupyterInputNode } from '../../../nodes/JupyterInputNode';
import { JupyterInputHighlightNode } from '../../../nodes/JupyterInputHighlightNode';
import { LayoutContainerNode } from '../../../nodes/LayoutContainerNode';
import { LayoutItemNode } from '../../../nodes/LayoutItemNode';
import { CollapsibleContainerNode } from '../../../plugins/CollapsiblePlugin/CollapsibleContainerNode';
import { CollapsibleContentNode } from '../../../plugins/CollapsiblePlugin/CollapsibleContentNode';
import { CollapsibleTitleNode } from '../../../plugins/CollapsiblePlugin/CollapsibleTitleNode';
import { $convertFromLatexString } from '../../latex';
import { $convertFromMarkdownString } from '../../markdown';
import { PLAYGROUND_TRANSFORMERS } from '../../transformers/MarkdownTransformers';

export const NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  LinkNode,
  AutoLinkNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  HorizontalRuleNode,
  EquationNode,
  ImageNode,
  YouTubeNode,
  JupyterInputNode,
  JupyterInputHighlightNode,
  LayoutContainerNode,
  LayoutItemNode,
  CollapsibleContainerNode,
  CollapsibleTitleNode,
  CollapsibleContentNode,
];

export function editorWithLatex(latex: string): LexicalEditor {
  const editor = createHeadlessEditor({
    nodes: NODES,
    onError: error => {
      throw error;
    },
  });
  editor.update(() => $convertFromLatexString(latex), { discrete: true });
  return editor;
}

export function editorWithMarkdown(markdown: string): LexicalEditor {
  const editor = createHeadlessEditor({
    nodes: NODES,
    onError: error => {
      throw error;
    },
  });
  editor.update(
    () => $convertFromMarkdownString(markdown, PLAYGROUND_TRANSFORMERS),
    { discrete: true },
  );
  return editor;
}
