/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Lexical → LaTeX.
 *
 * The walk is generic: every block goes through the element transformers,
 * every inline node through the text-match transformers, every text node
 * through the text-format transformers. What a node becomes is decided in
 * `LatexTransformers`, never here.
 *
 * With `document: true` the body is wrapped in a complete document. Its
 * `\title`, `\author` and `\date` come from the options, or else from the
 * document's own opening — the `h1`, the italic author line, the date the
 * importer makes of `\maketitle` — which is then left out of the body, so a
 * document read and written again keeps one title.
 *
 * @module convert/latex/LatexExport
 */

import type { ElementNode, LexicalNode, TextNode } from 'lexical';
import {
  $getRoot,
  $isDecoratorNode,
  $isElementNode,
  $isLineBreakNode,
  $isParagraphNode,
  $isTabNode,
  $isTextNode,
} from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import {
  hasChapters,
  LATEX_TRANSFORMERS,
  latexTransformersByType,
  type LatexExportContext,
  type LatexTransformer,
} from './LatexTransformers';
import { escapeLatex } from './utils';

export interface LatexExportOptions {
  /**
   * Wrap the body in a complete document, with a preamble loading what the
   * built-in transformers emit (math, graphics, links, listings, ulem, soul).
   */
  document?: boolean;
  /**
   * The document class of that document; `article` by default. A class with
   * chapters (`book`, `report`, …) writes an `h1` as `\chapter`.
   */
  documentClass?: string;
  /** Options of that class, e.g. `twocolumn`. */
  classOptions?: string[];
  /**
   * A title, typeset with `\maketitle`; plain text. Without it, a leading
   * `h1` is the title.
   */
  title?: string;
  /** The author(s) and date of that title; plain text. */
  author?: string;
  date?: string;
}

/** The packages the built-in transformers rely on. */
export const LATEX_PREAMBLE_PACKAGES = [
  '\\usepackage[utf8]{inputenc}',
  '\\usepackage[T1]{fontenc}',
  '\\usepackage{amsmath}',
  '\\usepackage{amssymb}',
  '\\usepackage{graphicx}',
  '\\usepackage{hyperref}',
  '\\usepackage{listings}',
  '\\usepackage{multicol}',
  '\\usepackage[normalem]{ulem}',
  '\\usepackage{soul}',
];

/** What goes in the preamble as the title block, as LaTeX. */
interface TitleBlock {
  title: string | null;
  subtitle: string | null;
  author: string | null;
  institute: string | null;
  date: string | null;
  /** How many leading blocks the title block took. */
  consumed: number;
}

const MONTHS =
  'january|february|march|april|may|june|july|august|september|october|november|december';

/** `September 2026`, `4 September 2026`, `September 9, 2026`, `2026-09-09`. */
const DATE_LINE = new RegExp(
  `^(?:\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${MONTHS})\\s+\\d{4}|(?:${MONTHS})\\s+(?:\\d{1,2},?\\s+)?\\d{4}|\\d{4}-\\d{2}-\\d{2}|\\d{1,2}/\\d{1,2}/\\d{2,4})$`,
  'i',
);

/** A paragraph of nothing but italic text: the author line `\maketitle` sets. */
function $isItalicLine(node: LexicalNode | undefined): node is ElementNode {
  if (!$isParagraphNode(node) || node.getChildrenSize() === 0) {
    return false;
  }
  return node
    .getChildren()
    .every(child => $isTextNode(child) && child.hasFormat('italic'));
}

function $isPlainLine(node: LexicalNode | undefined): node is ElementNode {
  return (
    $isParagraphNode(node) &&
    node.getChildrenSize() > 0 &&
    node.getChildren().every(child => $isTextNode(child))
  );
}

/**
 * The title block at the head of `children`: the options first, then what
 * the importer's rendering of `\maketitle` looks like.
 */
function $detectTitleBlock(
  children: LexicalNode[],
  options: LatexExportOptions,
  exportChildren: (node: ElementNode) => string,
): TitleBlock {
  const block: TitleBlock = {
    title: options.title ? escapeLatex(options.title) : null,
    subtitle: null,
    author: options.author ? escapeLatex(options.author) : null,
    institute: null,
    date: options.date ? escapeLatex(options.date) : null,
    consumed: 0,
  };
  const first = children[0];
  const isTitle =
    $isHeadingNode(first) &&
    first.getTag() === 'h1' &&
    (options.title === undefined || first.getTextContent() === options.title);
  if (!isTitle) {
    return block;
  }
  block.title = exportChildren(first);
  let i = 1;
  const next = children[i];
  if ($isHeadingNode(next) && next.getTag() === 'h3') {
    block.subtitle = exportChildren(next);
    i++;
  }
  if ($isItalicLine(children[i])) {
    if (!options.author) {
      block.author = escapeLatex(children[i].getTextContent());
    }
    i++;
    // After the author: a date, and in a talk the institute before it.
    const beamer = (options.documentClass ?? '').toLowerCase() === 'beamer';
    for (let n = 0; n < 2 && $isPlainLine(children[i]); n++) {
      const text = children[i].getTextContent().trim();
      if (DATE_LINE.test(text)) {
        if (!options.date) {
          block.date = escapeLatex(text);
        }
        i++;
        break;
      }
      if (beamer && block.institute === null) {
        block.institute = escapeLatex(text);
        i++;
        continue;
      }
      break;
    }
  }
  block.consumed = i;
  return block;
}

/**
 * A function that, called inside an editor read or update, returns the
 * LaTeX of the editor's document.
 */
export function createLatexExport(
  transformers: LatexTransformer[] = LATEX_TRANSFORMERS,
  options: LatexExportOptions = {},
): () => string {
  const byType = latexTransformersByType(transformers);

  const exportBlocks = (nodes: LexicalNode[]): string =>
    nodes
      .map(exportBlock)
      .filter((block): block is string => block !== null && block !== '')
      .join('\n\n');

  const exportBlock = (node: LexicalNode): string | null => {
    for (const transformer of byType.element) {
      const result = transformer.export(node, ctx);
      if (result !== null) {
        return result;
      }
    }
    if ($isElementNode(node)) {
      return exportChildren(node);
    }
    if ($isDecoratorNode(node)) {
      return exportInlineNode(node) ?? escapeLatex(node.getTextContent());
    }
    return null;
  };

  const exportInlineNode = (node: LexicalNode): string | null => {
    for (const transformer of byType.textMatch) {
      const result = transformer.export(node, ctx);
      if (result !== null) {
        return result;
      }
    }
    return null;
  };

  const exportText = (node: TextNode): string => {
    let text = escapeLatex(node.getTextContent());
    if (text === '') {
      return '';
    }
    // First transformer, innermost command: code sits inside bold, not around.
    for (const transformer of byType.textFormat) {
      if (node.hasFormat(transformer.format)) {
        text = `\\${transformer.command}{${text}}`;
      }
    }
    return text;
  };

  const exportChildren = (element: ElementNode): string => {
    const parts: string[] = [];
    for (const child of element.getChildren()) {
      if ($isLineBreakNode(child)) {
        parts.push('\\\\\n');
      } else if ($isTabNode(child)) {
        parts.push('\\quad{}');
      } else if ($isTextNode(child)) {
        parts.push(exportText(child));
      } else if ($isElementNode(child)) {
        // An inline element (a link, a mark) first, then a nested block.
        parts.push(exportInlineNode(child) ?? exportBlock(child) ?? '');
      } else if ($isDecoratorNode(child)) {
        parts.push(
          exportInlineNode(child) ?? escapeLatex(child.getTextContent()),
        );
      }
    }
    return parts.join('');
  };

  const ctx: LatexExportContext = {
    exportBlock,
    exportBlocks,
    exportChildren,
    chapters: hasChapters(options.documentClass),
  };

  return () => {
    const children = $getRoot().getChildren();
    if (!options.document) {
      return exportBlocks(children);
    }
    const titleBlock = $detectTitleBlock(children, options, exportChildren);
    return wrapDocument(
      exportBlocks(children.slice(titleBlock.consumed)),
      options,
      titleBlock,
    );
  };
}

function wrapDocument(
  body: string,
  options: LatexExportOptions,
  titleBlock: TitleBlock,
): string {
  const documentClass = options.documentClass ?? 'article';
  const classOptions = options.classOptions?.length
    ? `[${options.classOptions.join(',')}]`
    : '';
  const lines = [
    `\\documentclass${classOptions}{${documentClass}}`,
    ...LATEX_PREAMBLE_PACKAGES,
  ];
  const { title, subtitle, author, institute, date } = titleBlock;
  const lower = documentClass.toLowerCase();
  if (lower === 'moderncv' && title) {
    // The person's name is the title of a CV; the role is its subtitle.
    const space = title.lastIndexOf(' ');
    lines.push(
      space === -1
        ? `\\name{${title}}{}`
        : `\\name{${title.slice(0, space)}}{${title.slice(space + 1)}}`,
    );
    if (subtitle) {
      lines.push(`\\title{${subtitle}}`);
    }
  } else if (title) {
    if (subtitle && lower === 'beamer') {
      lines.push(`\\title{${title}}`, `\\subtitle{${subtitle}}`);
    } else if (subtitle) {
      lines.push(`\\title{${title}\\\\ \\large ${subtitle}}`);
    } else {
      lines.push(`\\title{${title}}`);
    }
  }
  if (title && author) {
    lines.push(`\\author{${author}}`);
  }
  if (title && institute) {
    lines.push(`\\institute{${institute}}`);
  }
  if (title && date) {
    lines.push(`\\date{${date}}`);
  }
  lines.push('', '\\begin{document}');
  if (title) {
    lines.push(lower === 'moderncv' ? '\\makecvtitle' : '\\maketitle');
  }
  lines.push('', body, '', '\\end{document}', '');
  return lines.join('\n');
}

/**
 * The LaTeX of the current editor state. Call inside `editor.read()` or
 * `editor.getEditorState().read()`.
 */
export function $convertToLatexString(
  transformers: LatexTransformer[] = LATEX_TRANSFORMERS,
  options: LatexExportOptions = {},
): string {
  return createLatexExport(transformers, options)();
}
