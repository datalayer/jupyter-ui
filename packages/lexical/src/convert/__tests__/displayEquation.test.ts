/**
 * @jest-environment jsdom
 */
/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * A `$$…$$` line in Markdown is one displayed equation.
 *
 * Notebooks write their displayed math that way, and the inline `$…$`
 * transformer used to read the inside of the pair and leave a dollar sign
 * on each side — which then went out to LaTeX as `\$…\$` and broke the
 * LaTeX importer's reading of everything after it.
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('@datalayer/jupyter-react', () => ({ __esModule: true }));

import { createHeadlessEditor } from '@lexical/headless';
import { $getRoot, $isParagraphNode, type LexicalEditor } from 'lexical';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { $isEquationNode, EquationNode } from '../../nodes/EquationNode';
import { ImageNode } from '../../nodes/ImageNode';
import { JupyterInputNode } from '../../nodes/JupyterInputNode';
import { JupyterInputHighlightNode } from '../../nodes/JupyterInputHighlightNode';
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from '../markdown';
import { PLAYGROUND_TRANSFORMERS } from '../transformers/MarkdownTransformers';

let editor: LexicalEditor;

beforeEach(() => {
  editor = createHeadlessEditor({
    nodes: [
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
      JupyterInputNode,
      JupyterInputHighlightNode,
    ],
    onError: error => {
      throw error;
    },
  });
});

describe('a displayed equation in Markdown', () => {
  it('reads as one block equation and writes back the same way', () => {
    editor.update(
      () =>
        $convertFromMarkdownString(
          'Before $a$ inline.\n\n$$E = mc^2$$\n\nAfter.',
          PLAYGROUND_TRANSFORMERS,
        ),
      { discrete: true },
    );
    editor.getEditorState().read(() => {
      const [before, math, after] = $getRoot().getChildren();
      expect(before.getTextContent()).toBe('Before $a$ inline.');
      expect($isParagraphNode(math) && math.getChildrenSize()).toBe(1);
      const equation = $isParagraphNode(math) ? math.getFirstChild() : null;
      expect($isEquationNode(equation) && equation.getEquation()).toBe(
        'E = mc^2',
      );
      expect($isEquationNode(equation) && equation.__inline).toBe(false);
      expect(after.getTextContent()).toBe('After.');
      const markdown = $convertToMarkdownString(PLAYGROUND_TRANSFORMERS);
      expect(markdown).toContain('\n\n$$E = mc^2$$\n\n');
      expect(markdown).not.toContain('$$$');
    });
  });
});
