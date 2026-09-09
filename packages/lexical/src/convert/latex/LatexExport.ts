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
 * @module convert/latex/LatexExport
 */

import type { ElementNode, LexicalNode, TextNode } from 'lexical';
import {
  $getRoot,
  $isDecoratorNode,
  $isElementNode,
  $isLineBreakNode,
  $isTabNode,
  $isTextNode,
} from 'lexical';
import {
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
  /** The document class of that document; `article` by default. */
  documentClass?: string;
  /** A title, typeset with `\maketitle`. */
  title?: string;
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
  '\\usepackage[normalem]{ulem}',
  '\\usepackage{soul}',
];

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

  const ctx: LatexExportContext = { exportBlock, exportBlocks, exportChildren };

  return () => {
    const body = exportBlocks($getRoot().getChildren());
    return options.document ? wrapDocument(body, options) : body;
  };
}

function wrapDocument(body: string, options: LatexExportOptions): string {
  const lines = [
    `\\documentclass{${options.documentClass ?? 'article'}}`,
    ...LATEX_PREAMBLE_PACKAGES,
  ];
  if (options.title) {
    lines.push(`\\title{${escapeLatex(options.title)}}`);
  }
  lines.push('', '\\begin{document}');
  if (options.title) {
    lines.push('\\maketitle');
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
