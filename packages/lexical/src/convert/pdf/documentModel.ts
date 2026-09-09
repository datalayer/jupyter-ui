/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The document as plain data, read from the editor in one synchronous pass,
 * for exporters that then work asynchronously (drawing equations, fetching
 * images) outside `editor.read()`. The PDF and Typst exporters share it.
 *
 * @module convert/pdf/documentModel
 */

import {
  $getRoot,
  $isDecoratorNode,
  $isElementNode,
  $isLineBreakNode,
  $isParagraphNode,
  $isTabNode,
  $isTextNode,
  type ElementNode,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical';
import { $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';
import { $isListItemNode, $isListNode } from '@lexical/list';
import { $isCodeNode } from '@lexical/code';
import { $isLinkNode } from '@lexical/link';
import {
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
} from '@lexical/table';
import { $isHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import type { IOutput } from '@jupyterlab/nbformat';
import { $isEquationNode } from '../../nodes/EquationNode';
import { $isImageNode } from '../../nodes/ImageNode';
import { $isYouTubeNode } from '../../nodes/YouTubeNode';
import { $isJupyterInputNode } from '../../nodes/JupyterInputNode';
import { $isJupyterOutputNode } from '../../nodes/JupyterOutputNode';
import { $isExcalidrawNode } from '../../nodes/ExcalidrawNode';
import {
  $isLayoutContainerNode,
  getItemsCountFromTemplate,
} from '../../nodes/LayoutContainerNode';
import { $isLayoutItemNode } from '../../nodes/LayoutItemNode';
import { $isCollapsibleContainerNode } from '../../plugins/CollapsiblePlugin/CollapsibleContainerNode';
import { $isCollapsibleTitleNode } from '../../plugins/CollapsiblePlugin/CollapsibleTitleNode';
import { $isCollapsibleContentNode } from '../../plugins/CollapsiblePlugin/CollapsibleContentNode';

export interface TextRun {
  kind: 'text';
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  subscript?: boolean;
  superscript?: boolean;
  highlight?: boolean;
  link?: string;
}

export interface BreakRun {
  kind: 'break';
}

export interface EquationRun {
  kind: 'equation';
  equation: string;
  key: string;
}

export type InlineRun = TextRun | BreakRun | EquationRun;

export type Alignment = 'left' | 'center' | 'right' | 'justify';

export interface ListItemModel {
  /** `null` for a plain list item, else a check box. */
  checked: boolean | null;
  blocks: Block[];
}

export interface TableCellModel {
  header: boolean;
  colSpan: number;
  inlines: InlineRun[];
}

export type Block =
  | {
      kind: 'heading';
      level: 1 | 2 | 3 | 4 | 5 | 6;
      inlines: InlineRun[];
      align: Alignment;
      indent: number;
    }
  | {
      kind: 'paragraph';
      inlines: InlineRun[];
      align: Alignment;
      indent: number;
    }
  | { kind: 'quote'; blocks: Block[] }
  | { kind: 'list'; ordered: boolean; start: number; items: ListItemModel[] }
  | {
      kind: 'code';
      language: string | null;
      text: string;
      executable: boolean;
      key: string;
    }
  | { kind: 'outputs'; outputs: IOutput[]; key: string }
  | { kind: 'table'; rows: TableCellModel[][] }
  | { kind: 'columns'; weights: number[]; columns: Block[][] }
  | { kind: 'rule' }
  | { kind: 'image'; src: string; alt: string; key: string }
  | { kind: 'equation'; equation: string; key: string }
  | { kind: 'collapsible'; title: InlineRun[]; blocks: Block[]; open: boolean }
  | { kind: 'embed'; label: string; url: string; key: string }
  | { kind: 'drawing'; key: string; label: string };

export interface DocumentModel {
  blocks: Block[];
  /** The first heading's text, for a title. */
  title: string | null;
}

/** `50fr 50fr` or `1fr 3fr` → `[50, 50]` / `[1, 3]`. */
export function columnWeights(template: string, count: number): number[] {
  const weights = template
    .split(/\s+/)
    .map(part => parseFloat(part))
    .filter(value => !Number.isNaN(value) && value > 0);
  if (weights.length === count) {
    return weights;
  }
  return Array.from({ length: count }, () => 1);
}

function alignmentOf(node: ElementNode): Alignment {
  const format = node.getFormatType();
  return format === 'center' || format === 'right' || format === 'justify'
    ? format
    : 'left';
}

/** The inline runs of an element: text with its formats, breaks, equations. */
export function $inlinesOf(node: ElementNode, link?: string): InlineRun[] {
  return $inlinesOfNodes(node.getChildren(), link);
}

export function $inlinesOfNodes(
  children: LexicalNode[],
  link?: string,
): InlineRun[] {
  const runs: InlineRun[] = [];
  for (const child of children) {
    if ($isLineBreakNode(child)) {
      runs.push({ kind: 'break' });
    } else if ($isTabNode(child)) {
      runs.push({ kind: 'text', text: '    ', link });
    } else if ($isTextNode(child)) {
      const text = child.getTextContent();
      if (text) {
        runs.push({
          kind: 'text',
          text,
          bold: child.hasFormat('bold'),
          italic: child.hasFormat('italic'),
          code: child.hasFormat('code'),
          underline: child.hasFormat('underline'),
          strikethrough: child.hasFormat('strikethrough'),
          subscript: child.hasFormat('subscript'),
          superscript: child.hasFormat('superscript'),
          highlight: child.hasFormat('highlight'),
          link,
        });
      }
    } else if ($isLinkNode(child)) {
      runs.push(...$inlinesOf(child, child.getURL()));
    } else if ($isEquationNode(child)) {
      runs.push({
        kind: 'equation',
        equation: child.getEquation(),
        key: child.getKey(),
      });
    } else if ($isElementNode(child)) {
      // A mark, a hashtag wrapper: what is inside.
      runs.push(...$inlinesOf(child, link));
    } else if ($isDecoratorNode(child)) {
      const text = child.getTextContent();
      if (text) {
        runs.push({ kind: 'text', text, link });
      }
    }
  }
  return runs;
}

/** Nested blocks flattened to one run of inlines, lines between blocks. */
export function flattenToInlines(blocks: Block[]): InlineRun[] {
  const runs: InlineRun[] = [];
  const push = (more: InlineRun[]) => {
    if (runs.length && more.length) {
      runs.push({ kind: 'break' });
    }
    runs.push(...more);
  };
  for (const block of blocks) {
    switch (block.kind) {
      case 'heading':
        push(
          block.inlines.map(run =>
            run.kind === 'text' ? { ...run, bold: true } : run,
          ),
        );
        break;
      case 'paragraph':
        push(block.inlines);
        break;
      case 'quote':
      case 'collapsible':
        push(flattenToInlines(block.blocks));
        break;
      case 'list':
        block.items.forEach((item, i) => {
          const marker = block.ordered ? `${block.start + i}. ` : '• ';
          push([
            { kind: 'text', text: marker },
            ...flattenToInlines(item.blocks),
          ]);
        });
        break;
      case 'code':
        push([{ kind: 'text', text: block.text, code: true }]);
        break;
      case 'equation':
        push([{ kind: 'equation', equation: block.equation, key: block.key }]);
        break;
      case 'image':
        push([{ kind: 'text', text: block.alt || '[image]', italic: true }]);
        break;
      case 'embed':
        push([{ kind: 'text', text: block.label, link: block.url }]);
        break;
      case 'table':
        block.rows.forEach(row =>
          push(
            row.flatMap((cell, i) => [
              ...(i ? [{ kind: 'text', text: ' | ' } as InlineRun] : []),
              ...cell.inlines,
            ]),
          ),
        );
        break;
      case 'columns':
        block.columns.forEach(column => push(flattenToInlines(column)));
        break;
      default:
        break;
    }
  }
  return runs;
}

function $listItems(list: import('@lexical/list').ListNode): ListItemModel[] {
  const items: ListItemModel[] = [];
  for (const item of list.getChildren()) {
    if (!$isListItemNode(item)) {
      continue;
    }
    const first = item.getFirstChild();
    if (item.getChildrenSize() === 1 && $isListNode(first)) {
      // A nested list: it belongs to the item before it.
      const nested = $blockOf(first);
      const previous = items[items.length - 1];
      if (previous && nested) {
        previous.blocks.push(nested);
      } else if (nested) {
        items.push({ checked: null, blocks: [nested] });
      }
      continue;
    }
    const blocks: Block[] = [];
    const inlines: InlineRun[] = [];
    for (const child of item.getChildren()) {
      if ($isElementNode(child) && !$isLinkNode(child)) {
        const block = $blockOf(child);
        if (block && block.kind !== 'paragraph') {
          if (inlines.length) {
            blocks.push({
              kind: 'paragraph',
              inlines: [...inlines],
              align: 'left',
              indent: 0,
            });
            inlines.length = 0;
          }
          blocks.push(block);
          continue;
        }
      }
      inlines.push(...$inlinesOfNodes([child]));
    }
    if (inlines.length || blocks.length === 0) {
      blocks.unshift({ kind: 'paragraph', inlines, align: 'left', indent: 0 });
    }
    items.push({
      checked:
        list.getListType() === 'check' ? item.getChecked() === true : null,
      blocks,
    });
  }
  return items;
}

/** The block a top-level (or nested) node is, or `null` for nothing to show. */
export function $blockOf(node: LexicalNode): Block | null {
  if ($isHeadingNode(node)) {
    const level = Math.min(6, Math.max(1, Number(node.getTag().slice(1)) || 1));
    return {
      kind: 'heading',
      level: level as 1 | 2 | 3 | 4 | 5 | 6,
      inlines: $inlinesOf(node),
      align: alignmentOf(node),
      indent: node.getIndent(),
    };
  }
  if ($isQuoteNode(node)) {
    return {
      kind: 'quote',
      blocks: [
        {
          kind: 'paragraph',
          inlines: $inlinesOf(node),
          align: 'left',
          indent: 0,
        },
      ],
    };
  }
  if ($isListNode(node)) {
    return {
      kind: 'list',
      ordered: node.getListType() === 'number',
      start: node.getStart(),
      items: $listItems(node),
    };
  }
  if ($isJupyterInputNode(node)) {
    return {
      kind: 'code',
      language: node.getLanguage() ?? 'python',
      text: node.getTextContent(),
      executable: true,
      key: node.getKey(),
    };
  }
  if ($isCodeNode(node)) {
    return {
      kind: 'code',
      language: node.getLanguage() ?? null,
      text: node.getTextContent(),
      executable: false,
      key: node.getKey(),
    };
  }
  if ($isJupyterOutputNode(node)) {
    return { kind: 'outputs', outputs: node.getOutputs(), key: node.getKey() };
  }
  if ($isTableNode(node)) {
    const rows: TableCellModel[][] = [];
    for (const row of node.getChildren()) {
      if (!$isTableRowNode(row)) {
        continue;
      }
      const cells: TableCellModel[] = [];
      for (const cell of row.getChildren()) {
        if (!$isTableCellNode(cell)) {
          continue;
        }
        cells.push({
          header: cell.hasHeader(),
          colSpan: Math.max(1, cell.getColSpan()),
          inlines: flattenToInlines($blocksOf(cell.getChildren())),
        });
      }
      rows.push(cells);
    }
    return { kind: 'table', rows };
  }
  if ($isLayoutContainerNode(node)) {
    const items = node.getChildren().filter($isLayoutItemNode);
    const count = Math.max(
      items.length,
      getItemsCountFromTemplate(node.getTemplateColumns()),
    );
    return {
      kind: 'columns',
      weights: columnWeights(node.getTemplateColumns(), count).slice(
        0,
        items.length,
      ),
      columns: items.map(item => $blocksOf(item.getChildren())),
    };
  }
  if ($isCollapsibleContainerNode(node)) {
    const title = node.getChildren().find($isCollapsibleTitleNode);
    const content = node.getChildren().find($isCollapsibleContentNode);
    return {
      kind: 'collapsible',
      title: title ? $inlinesOf(title) : [],
      blocks: content ? $blocksOf(content.getChildren()) : [],
      open: node.getOpen(),
    };
  }
  if ($isHorizontalRuleNode(node)) {
    return { kind: 'rule' };
  }
  if ($isImageNode(node)) {
    return {
      kind: 'image',
      src: node.getSrc(),
      alt: node.getAltText(),
      key: node.getKey(),
    };
  }
  if ($isEquationNode(node)) {
    return {
      kind: 'equation',
      equation: node.getEquation(),
      key: node.getKey(),
    };
  }
  if ($isYouTubeNode(node)) {
    const id = node.getId();
    return {
      kind: 'embed',
      label: `YouTube video ${id}`,
      url: `https://www.youtube.com/watch?v=${id}`,
      key: node.getKey(),
    };
  }
  if ($isExcalidrawNode(node)) {
    return { kind: 'drawing', key: node.getKey(), label: 'Drawing' };
  }
  if ($isParagraphNode(node)) {
    const inlines = $inlinesOf(node);
    // A paragraph holding one block equation or one image: that block.
    const only = node.getChildrenSize() === 1 ? node.getFirstChild() : null;
    if (only && $isEquationNode(only) && !only.__inline) {
      return {
        kind: 'equation',
        equation: only.getEquation(),
        key: only.getKey(),
      };
    }
    if (only && $isImageNode(only)) {
      return {
        kind: 'image',
        src: only.getSrc(),
        alt: only.getAltText(),
        key: only.getKey(),
      };
    }
    return {
      kind: 'paragraph',
      inlines,
      align: alignmentOf(node),
      indent: node.getIndent(),
    };
  }
  if ($isElementNode(node)) {
    const nested = $blocksOf(node.getChildren());
    if (nested.length) {
      return nested.length === 1
        ? nested[0]
        : { kind: 'quote', blocks: nested };
    }
    const inlines = $inlinesOf(node);
    return inlines.length
      ? { kind: 'paragraph', inlines, align: 'left', indent: 0 }
      : null;
  }
  if ($isDecoratorNode(node)) {
    return {
      kind: 'drawing',
      key: node.getKey(),
      label: node.getTextContent() || node.getType(),
    };
  }
  return null;
}

export function $blocksOf(nodes: LexicalNode[]): Block[] {
  const blocks: Block[] = [];
  for (const node of nodes) {
    const block = $blockOf(node);
    if (block) {
      blocks.push(block);
    }
  }
  return blocks;
}

/** The text of inline runs, for titles and measuring. */
export function inlineText(runs: InlineRun[]): string {
  return runs
    .map(run =>
      run.kind === 'text'
        ? run.text
        : run.kind === 'break'
          ? '\n'
          : run.equation,
    )
    .join('');
}

/** The document, read now. Call inside `editor.read()` or through `readDocument`. */
export function $readDocument(): DocumentModel {
  const blocks = $blocksOf($getRoot().getChildren());
  const heading = blocks.find(block => block.kind === 'heading');
  return {
    blocks,
    title:
      heading && heading.kind === 'heading'
        ? inlineText(heading.inlines)
        : null,
  };
}

export function readDocument(editor: LexicalEditor): DocumentModel {
  return editor.getEditorState().read($readDocument);
}
