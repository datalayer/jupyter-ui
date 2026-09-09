/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * LaTeX transformers: the unit of conversion between Lexical nodes and LaTeX.
 *
 * Shaped after `@lexical/markdown`'s transformers. An *element* transformer
 * owns a block (a heading, a list, a code listing, a table) and knows both
 * how to write it and, through `import`, which LaTeX environment or line
 * command it reads. A *text format* transformer pairs a text format with the
 * command that sets it. A *text match* transformer owns an inline node (an
 * equation, an image, a link) and the inline command or math that produces
 * it. The exporter and the importer are only the walk; everything specific
 * to a node lives here, so a host adds a node by adding a transformer.
 *
 * @module convert/latex/LatexTransformers
 */

import type { ElementNode, Klass, LexicalNode, TextFormatType } from 'lexical';
import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $isElementNode,
  $isParagraphNode,
} from 'lexical';
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
  HeadingNode,
  QuoteNode,
  type HeadingTagType,
} from '@lexical/rich-text';
import {
  $createListItemNode,
  $createListNode,
  $isListItemNode,
  $isListNode,
  ListItemNode,
  ListNode,
  type ListType,
} from '@lexical/list';
import {
  $createCodeNode,
  $isCodeNode,
  CodeHighlightNode,
  CodeNode,
} from '@lexical/code';
import {
  $createLinkNode,
  $isLinkNode,
  AutoLinkNode,
  LinkNode,
} from '@lexical/link';
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  TableCellHeaderStates,
  TableCellNode,
  TableNode,
  TableRowNode,
} from '@lexical/table';
import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
  HorizontalRuleNode,
} from '@lexical/react/LexicalHorizontalRuleNode';
import * as nbformat from '@jupyterlab/nbformat';
import {
  $createEquationNode,
  $isEquationNode,
  EquationNode,
} from '../../nodes/EquationNode';
import {
  $createImageNode,
  $isImageNode,
  ImageNode,
} from '../../nodes/ImageNode';
import {
  $createYouTubeNode,
  $isYouTubeNode,
  YouTubeNode,
} from '../../nodes/YouTubeNode';
import {
  $createJupyterInputNode,
  $isJupyterInputNode,
  JupyterInputNode,
} from '../../nodes/JupyterInputNode';
import {
  $isJupyterOutputNode,
  JupyterOutputNode,
} from '../../nodes/JupyterOutputNode';
import {
  $isCollapsibleContainerNode,
  CollapsibleContainerNode,
} from '../../plugins/CollapsiblePlugin/CollapsibleContainerNode';
import { escapeLatex, readBraceArgument, readOption } from './utils';

// ─── Types ─────────────────────────────────────────────────────────────────

/** What a transformer may call while exporting. */
export interface LatexExportContext {
  /** The inline content of an element: its text, formats and inline nodes. */
  exportChildren: (node: ElementNode) => string;
  /** A block on its own, through the element transformers. */
  exportBlock: (node: LexicalNode) => string | null;
  /** Several blocks, separated by blank lines. */
  exportBlocks: (nodes: LexicalNode[]) => string;
}

/** What a transformer may call while importing. */
export interface LatexImportContext {
  /** Blocks out of a piece of LaTeX (a list item's body, a quote's body). */
  importBlocks: (latex: string) => LexicalNode[];
  /** Inline nodes out of a piece of LaTeX (a heading's title, a cell). */
  importInline: (latex: string) => LexicalNode[];
}

/** A `\begin{name}…\end{name}` found by the importer. */
export interface LatexEnvironmentBlock {
  name: string;
  /** The `[…]` after `\begin{name}`, without the brackets. */
  options: string | null;
  /** The `{…}` after `\begin{name}` (and its options), without the braces. */
  argument: string | null;
  body: string;
}

export type LatexBlockImport =
  | {
      kind: 'environment';
      /** The environments this transformer reads (`*` variants included). */
      names: string[];
      replace: (
        block: LatexEnvironmentBlock,
        ctx: LatexImportContext,
      ) => LexicalNode[];
    }
  | {
      kind: 'line';
      /** Matched against one trimmed line that stands on its own. */
      regExp: RegExp;
      replace: (
        match: RegExpMatchArray,
        line: string,
        ctx: LatexImportContext,
      ) => LexicalNode[];
    };

export type LatexElementTransformer = {
  type: 'element';
  dependencies: Array<Klass<LexicalNode>>;
  /** LaTeX for `node`, or `null` when this transformer does not own it. */
  export: (node: LexicalNode, ctx: LatexExportContext) => string | null;
  import?: LatexBlockImport;
};

export type LatexTextFormatTransformer = {
  type: 'text-format';
  format: TextFormatType;
  /** The command that sets the format, e.g. `textbf`. */
  command: string;
  /** Other commands read as the same format on import, e.g. `emph`. */
  aliases?: string[];
};

export type LatexTextMatchTransformer = {
  type: 'text-match';
  dependencies: Array<Klass<LexicalNode>>;
  /** LaTeX for an inline node (a decorator, a link), or `null`. */
  export: (node: LexicalNode, ctx: LatexExportContext) => string | null;
  /** Inline commands this transformer reads, with the node they make. */
  importCommand?: {
    names: string[];
    /** `args` are the brace arguments, `options` the `[…]` before them. */
    replace: (
      args: string[],
      options: string | null,
      ctx: LatexImportContext,
    ) => LexicalNode | null;
  };
  /** Math this transformer reads: `$…$` and `\(…\)` inline, `\[…\]` and `$$…$$` display. */
  importMath?: (equation: string, display: boolean) => LexicalNode;
};

export type LatexTransformer =
  | LatexElementTransformer
  | LatexTextFormatTransformer
  | LatexTextMatchTransformer;

// ─── Helpers ───────────────────────────────────────────────────────────────

const HEADING_COMMANDS: Record<HeadingTagType, string> = {
  h1: 'section',
  h2: 'subsection',
  h3: 'subsubsection',
  h4: 'paragraph',
  h5: 'subparagraph',
  h6: 'subparagraph',
};

const HEADING_TAGS: Record<string, HeadingTagType> = {
  chapter: 'h1',
  section: 'h1',
  subsection: 'h2',
  subsubsection: 'h3',
  paragraph: 'h4',
  subparagraph: 'h5',
};

/** `python` → `Python`: the spelling `listings` expects. */
function listingsLanguage(language: string | null | undefined): string | null {
  if (!language) {
    return null;
  }
  const known: Record<string, string> = {
    js: 'JavaScript',
    javascript: 'JavaScript',
    ts: 'TypeScript',
    typescript: 'TypeScript',
    py: 'Python',
    python: 'Python',
    sh: 'bash',
    bash: 'bash',
    r: 'R',
    sql: 'SQL',
    c: 'C',
    cpp: 'C++',
    java: 'Java',
    html: 'HTML',
    xml: 'XML',
    json: 'JSON',
    markdown: 'Markdown',
    md: 'Markdown',
  };
  return known[language.toLowerCase()] ?? language;
}

/** The body of a code environment: without the newlines the delimiters add. */
function codeBody(body: string): string {
  return body.replace(/^\n/, '').replace(/\n[ \t]*$/, '');
}

/** The text of a Jupyter output, the way a terminal would show it. */
function outputText(output: nbformat.IOutput): string | null {
  if (nbformat.isStream(output)) {
    return joinSource(output.text);
  }
  if (nbformat.isExecuteResult(output) || nbformat.isDisplayData(output)) {
    const plain = output.data['text/plain'];
    return plain === undefined ? null : joinSource(plain as string | string[]);
  }
  if (nbformat.isError(output)) {
    return (
      output.traceback
        .join('\n')
        // ANSI colour codes have no place in a listing.
        .replace(/\u001b\[[0-9;]*m/g, '')
    );
  }
  return null;
}

function joinSource(source: string | string[]): string {
  return Array.isArray(source) ? source.join('') : source;
}

function codeEnvironment(
  text: string,
  language: string | null | undefined,
): string {
  const lang = listingsLanguage(language);
  const options = lang ? `[language=${lang}]` : '';
  return `\\begin{lstlisting}${options}\n${text}\n\\end{lstlisting}`;
}

function verbatimEnvironment(text: string): string {
  return `\\begin{verbatim}\n${text}\n\\end{verbatim}`;
}

/** Split a string on `separator` at brace depth zero, skipping escapes. */
function splitTopLevel(text: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let envDepth = 0;
  let current = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '\\') {
      if (text.startsWith('\\begin{', i)) {
        envDepth++;
      } else if (text.startsWith('\\end{', i)) {
        envDepth--;
      }
      if (text.startsWith(separator, i) && depth === 0 && envDepth === 0) {
        parts.push(current);
        current = '';
        i += separator.length - 1;
        continue;
      }
      current += ch + (text[i + 1] ?? '');
      i++;
      continue;
    }
    if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
    }
    if (
      !separator.startsWith('\\') &&
      text.startsWith(separator, i) &&
      depth === 0 &&
      envDepth === 0
    ) {
      parts.push(current);
      current = '';
      i += separator.length - 1;
      continue;
    }
    current += ch;
  }
  parts.push(current);
  return parts;
}

/** The inline nodes of a block, several blocks joined by line breaks. */
function inlineNodesOf(blocks: LexicalNode[]): {
  inline: LexicalNode[];
  rest: LexicalNode[];
} {
  const inline: LexicalNode[] = [];
  const rest: LexicalNode[] = [];
  for (const block of blocks) {
    if (
      ($isParagraphNode(block) ||
        $isQuoteNode(block) ||
        $isHeadingNode(block)) &&
      $isElementNode(block)
    ) {
      if (inline.length > 0) {
        inline.push($createLineBreakNode());
      }
      inline.push(...block.getChildren());
    } else {
      rest.push(block);
    }
  }
  return { inline, rest };
}

// ─── Element transformers ──────────────────────────────────────────────────

export const LATEX_HEADING: LatexElementTransformer = {
  type: 'element',
  dependencies: [HeadingNode],
  export: (node, { exportChildren }) => {
    if (!$isHeadingNode(node)) {
      return null;
    }
    const command = HEADING_COMMANDS[node.getTag()] ?? 'section';
    return `\\${command}{${exportChildren(node)}}`;
  },
  import: {
    kind: 'line',
    regExp:
      /^\\(chapter|section|subsection|subsubsection|paragraph|subparagraph)\*?\s*\{/,
    replace: (match, line, { importInline }) => {
      const argument = readBraceArgument(line, match[0].length - 1);
      const heading = $createHeadingNode(HEADING_TAGS[match[1]] ?? 'h1');
      heading.append(...importInline(argument ? argument.value : ''));
      return [heading];
    },
  },
};

export const LATEX_QUOTE: LatexElementTransformer = {
  type: 'element',
  dependencies: [QuoteNode],
  export: (node, { exportChildren }) => {
    if (!$isQuoteNode(node)) {
      return null;
    }
    return `\\begin{quote}\n${exportChildren(node)}\n\\end{quote}`;
  },
  import: {
    kind: 'environment',
    names: ['quote', 'quotation', 'abstract', 'verse'],
    replace: (block, { importBlocks }) => {
      const { inline, rest } = inlineNodesOf(importBlocks(block.body));
      const quote = $createQuoteNode();
      quote.append(...inline);
      return [quote, ...rest];
    },
  },
};

const CHECKED_LABEL = '$\\boxtimes$';
const UNCHECKED_LABEL = '$\\square$';

function exportList(
  list: ListNode,
  ctx: LatexExportContext,
  depth: number,
): string {
  const indent = '  '.repeat(depth);
  const environment = list.getListType() === 'number' ? 'enumerate' : 'itemize';
  const lines: string[] = [`${indent}\\begin{${environment}}`];
  for (const item of list.getChildren()) {
    if (!$isListItemNode(item)) {
      continue;
    }
    const first = item.getFirstChild();
    if (item.getChildrenSize() === 1 && $isListNode(first)) {
      lines.push(exportList(first, ctx, depth + 1));
      continue;
    }
    let label = '';
    if (list.getListType() === 'check') {
      label = `[${item.getChecked() ? CHECKED_LABEL : UNCHECKED_LABEL}]`;
    }
    lines.push(
      `${indent}  \\item${label} ${ctx.exportChildren(item)}`.trimEnd(),
    );
  }
  lines.push(`${indent}\\end{${environment}}`);
  return lines.join('\n');
}

function importListItems(
  body: string,
  listType: ListType,
  ctx: LatexImportContext,
): ListNode {
  const list = $createListNode(listType);
  const items = splitTopLevel(body, '\\item').slice(1);
  for (const raw of items) {
    let text = raw;
    let checked: boolean | undefined;
    const optional = /^\s*\[/.test(text) ? readBraceLikeOption(text) : null;
    if (optional) {
      const label = optional.value.trim();
      if (
        label === CHECKED_LABEL ||
        /checkmark|boxtimes|CheckedBox/.test(label)
      ) {
        checked = true;
      } else if (label === UNCHECKED_LABEL || /square|Box\b/.test(label)) {
        checked = false;
      }
      text = text.slice(optional.end);
    }
    const blocks = ctx.importBlocks(text);
    const { inline, rest } = inlineNodesOf(blocks);
    const item = $createListItemNode(
      listType === 'check' || checked !== undefined
        ? (checked ?? false)
        : undefined,
    );
    item.append(...inline);
    list.append(item);
    for (const nested of rest) {
      if ($isListNode(nested)) {
        const holder = $createListItemNode();
        holder.append(nested);
        list.append(holder);
      } else if ($isElementNode(nested)) {
        // A block a list item cannot hold: keep its text with the item.
        item.append($createLineBreakNode(), ...nested.getChildren());
      }
    }
  }
  return list;
}

function readBraceLikeOption(
  text: string,
): { value: string; end: number } | null {
  const start = text.indexOf('[');
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '[') {
      depth++;
    } else if (text[i] === ']') {
      depth--;
      if (depth === 0) {
        return { value: text.slice(start + 1, i), end: i + 1 };
      }
    }
  }
  return null;
}

export const LATEX_LIST: LatexElementTransformer = {
  type: 'element',
  dependencies: [ListNode, ListItemNode],
  export: (node, ctx) => {
    if (!$isListNode(node)) {
      return null;
    }
    return exportList(node, ctx, 0);
  },
  import: {
    kind: 'environment',
    names: ['itemize', 'enumerate', 'description'],
    replace: (block, ctx) => {
      const hasCheckBoxes = /\\item\s*\[\s*\$\\(boxtimes|square)\$\s*\]/.test(
        block.body,
      );
      const listType: ListType = hasCheckBoxes
        ? 'check'
        : block.name === 'enumerate'
          ? 'number'
          : 'bullet';
      return [importListItems(block.body, listType, ctx)];
    },
  },
};

export const LATEX_CODE: LatexElementTransformer = {
  type: 'element',
  dependencies: [CodeNode, CodeHighlightNode],
  export: node => {
    if (!$isCodeNode(node)) {
      return null;
    }
    return codeEnvironment(node.getTextContent(), node.getLanguage());
  },
  import: {
    kind: 'environment',
    names: ['verbatim', 'Verbatim', 'alltt'],
    replace: block => {
      const code = $createCodeNode();
      code.append($createTextNode(codeBody(block.body)));
      return [code];
    },
  },
};

export const LATEX_JUPYTER_INPUT: LatexElementTransformer = {
  type: 'element',
  dependencies: [JupyterInputNode],
  export: node => {
    if (!$isJupyterInputNode(node)) {
      return null;
    }
    return codeEnvironment(
      node.getTextContent(),
      node.getLanguage() ?? 'python',
    );
  },
  import: {
    kind: 'environment',
    names: ['lstlisting', 'minted', 'pythoncode', 'code'],
    replace: block => {
      const language =
        block.name === 'minted'
          ? block.argument
          : readOption(block.options, 'language');
      const input = $createJupyterInputNode(
        language ? language.toLowerCase() : 'python',
      );
      input.append($createTextNode(codeBody(block.body)));
      return [input];
    },
  },
};

export const LATEX_JUPYTER_OUTPUT: LatexElementTransformer = {
  type: 'element',
  dependencies: [JupyterOutputNode],
  export: node => {
    if (!$isJupyterOutputNode(node)) {
      return null;
    }
    const texts = node
      .getOutputs()
      .map(outputText)
      .filter((text): text is string => text !== null && text.trim() !== '');
    if (texts.length === 0) {
      // Pictures and widgets have no LaTeX; say so rather than drop them silently.
      return node.getOutputs().length > 0 ? '% [output omitted]' : '';
    }
    return verbatimEnvironment(texts.join('\n').replace(/\n$/, ''));
  },
};

export const LATEX_HORIZONTAL_RULE: LatexElementTransformer = {
  type: 'element',
  dependencies: [HorizontalRuleNode as unknown as Klass<LexicalNode>],
  export: node =>
    $isHorizontalRuleNode(node) ? '\\noindent\\hrulefill' : null,
  import: {
    kind: 'line',
    regExp: /^(\\noindent\s*)?(\\hrulefill|\\rule\{[^}]*\}\{[^}]*\}|\\hline)$/,
    replace: () => [$createHorizontalRuleNode() as unknown as LexicalNode],
  },
};

function exportTable(table: TableNode, ctx: LatexExportContext): string {
  const rows = table.getChildren().filter($isTableRowNode) as TableRowNode[];
  const columns = Math.max(
    1,
    ...rows.map(row => row.getChildren().filter($isTableCellNode).length),
  );
  const lines = [`\\begin{tabular}{|${'l|'.repeat(columns)}}`, '\\hline'];
  rows.forEach((row, rowIndex) => {
    const cells = row.getChildren().filter($isTableCellNode) as TableCellNode[];
    const isHeader =
      cells.length > 0 &&
      cells.every(cell => cell.hasHeaderState(TableCellHeaderStates.ROW));
    const content = cells.map(cell =>
      cell
        .getChildren()
        .map(child =>
          $isElementNode(child)
            ? ctx.exportChildren(child)
            : ctx.exportBlock(child),
        )
        .filter(Boolean)
        .join(' '),
    );
    lines.push(`${content.join(' & ')} \\\\`);
    if (isHeader || rowIndex === rows.length - 1) {
      lines.push('\\hline');
    }
  });
  lines.push('\\end{tabular}');
  return lines.join('\n');
}

function importTable(
  block: LatexEnvironmentBlock,
  ctx: LatexImportContext,
): LexicalNode[] {
  // Rules only tell where the header ends; they are not content.
  const body = block.body.replace(/\\(toprule|midrule|bottomrule)/g, '\\hline');
  const rowsRaw = splitTopLevel(body, '\\\\')
    .map(row => row.replace(/^\s*\[[^\]]*\]/, ''))
    .map(row => ({
      hlineBefore: /^\s*\\hline/.test(row),
      hlineAfter: /\\hline\s*$/.test(row),
      text: row.replace(/\\hline/g, '').trim(),
    }))
    .filter(row => row.text !== '');
  if (rowsRaw.length === 0) {
    return [];
  }
  const table = $createTableNode();
  // The first row is a header when a rule separates it from the second.
  const firstIsHeader = rowsRaw.length > 1 && rowsRaw[1].hlineBefore;
  rowsRaw.forEach((row, rowIndex) => {
    const tableRow = $createTableRowNode();
    for (const cellText of splitTopLevel(row.text, '&')) {
      const cell = $createTableCellNode(
        rowIndex === 0 && firstIsHeader
          ? TableCellHeaderStates.ROW
          : TableCellHeaderStates.NO_STATUS,
      );
      const paragraph = $createParagraphNode();
      paragraph.append(...ctx.importInline(cellText.trim()));
      cell.append(paragraph);
      tableRow.append(cell);
    }
    table.append(tableRow);
  });
  return [table];
}

export const LATEX_TABLE: LatexElementTransformer = {
  type: 'element',
  dependencies: [TableNode, TableRowNode, TableCellNode],
  export: (node, ctx) => ($isTableNode(node) ? exportTable(node, ctx) : null),
  import: {
    kind: 'environment',
    names: ['tabular', 'tabularx', 'longtable', 'tabulary'],
    replace: importTable,
  },
};

/** `table` and `figure` are floats: what matters is what they hold. */
export const LATEX_FLOAT: LatexElementTransformer = {
  type: 'element',
  dependencies: [],
  export: () => null,
  import: {
    kind: 'environment',
    names: ['table', 'table*', 'center', 'flushleft', 'flushright', 'minipage'],
    replace: (block, { importBlocks }) =>
      importBlocks(
        // A caption has no block of its own; it reads as a paragraph.
        block.body
          .replace(/\\caption\{/g, '\\textit{')
          .replace(/\\centering/g, ''),
      ),
  },
};

export const LATEX_FIGURE: LatexElementTransformer = {
  type: 'element',
  dependencies: [ImageNode],
  export: node => {
    // A paragraph holding one image is a figure; an inline image is not.
    if (!$isParagraphNode(node) || node.getChildrenSize() !== 1) {
      return null;
    }
    const image = node.getFirstChild();
    if (!$isImageNode(image)) {
      return null;
    }
    const caption = image.getAltText()
      ? `\n\\caption{${escapeLatex(image.getAltText())}}`
      : '';
    return `\\begin{figure}[h]\n\\centering\n\\includegraphics[width=\\linewidth]{${image.getSrc()}}${caption}\n\\end{figure}`;
  },
  import: {
    kind: 'environment',
    names: ['figure', 'figure*', 'wrapfigure'],
    replace: block => {
      const graphic = /\\includegraphics(?:\[[^\]]*\])?\{([^}]*)\}/.exec(
        block.body,
      );
      if (!graphic) {
        return [];
      }
      const captionStart = block.body.indexOf('\\caption');
      const caption =
        captionStart === -1
          ? null
          : readBraceArgument(block.body, captionStart + '\\caption'.length);
      const paragraph = $createParagraphNode();
      paragraph.append(
        $createImageNode({
          altText: caption
            ? caption.value.replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')
            : '',
          maxWidth: 800,
          src: graphic[1],
        }),
      );
      return [paragraph];
    },
  },
};

export const LATEX_DISPLAY_EQUATION: LatexElementTransformer = {
  type: 'element',
  dependencies: [EquationNode],
  export: node => {
    if (!$isParagraphNode(node) || node.getChildrenSize() !== 1) {
      return null;
    }
    const equation = node.getFirstChild();
    if (!$isEquationNode(equation) || equation.__inline) {
      return null;
    }
    return `\\[\n${equation.getEquation()}\n\\]`;
  },
  import: {
    kind: 'environment',
    names: [
      'equation',
      'equation*',
      'align',
      'align*',
      'gather',
      'gather*',
      'multline',
      'multline*',
      'eqnarray',
      'eqnarray*',
      'displaymath',
      'math',
    ],
    replace: block => {
      const paragraph = $createParagraphNode();
      const base = block.name.replace(/\*$/, '');
      // KaTeX renders the inner forms of the AMS environments, not the outer.
      const inner: Record<string, string> = {
        align: 'aligned',
        eqnarray: 'aligned',
        gather: 'gathered',
        multline: 'gathered',
      };
      const body = block.body.trim();
      const equation = inner[base]
        ? `\\begin{${inner[base]}}${body}\\end{${inner[base]}}`
        : body;
      paragraph.append($createEquationNode(equation, block.name === 'math'));
      return [paragraph];
    },
  },
};

export const LATEX_YOUTUBE: LatexElementTransformer = {
  type: 'element',
  dependencies: [YouTubeNode],
  export: node =>
    $isYouTubeNode(node)
      ? `\\url{https://www.youtube.com/watch?v=${node.getId()}}`
      : null,
  import: {
    kind: 'line',
    regExp:
      /^\\(?:url|href)\{https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})[^}]*\}(?:\{[^}]*\})?$/,
    replace: match => [$createYouTubeNode(match[1])],
  },
};

export const LATEX_COLLAPSIBLE: LatexElementTransformer = {
  type: 'element',
  dependencies: [CollapsibleContainerNode],
  export: (node, ctx) => {
    if (!$isCollapsibleContainerNode(node)) {
      return null;
    }
    const [title, content] = node.getChildren();
    const heading = title
      ? `\\paragraph{${escapeLatex(title.getTextContent())}}`
      : '';
    const body = $isElementNode(content)
      ? ctx.exportBlocks(content.getChildren())
      : '';
    return [heading, body].filter(Boolean).join('\n\n');
  },
};

// ─── Text format transformers ──────────────────────────────────────────────

export const LATEX_CODE_FORMAT: LatexTextFormatTransformer = {
  type: 'text-format',
  format: 'code',
  command: 'texttt',
  aliases: ['lstinline', 'mintinline'],
};

export const LATEX_BOLD: LatexTextFormatTransformer = {
  type: 'text-format',
  format: 'bold',
  command: 'textbf',
  aliases: ['bf', 'bfseries'],
};

export const LATEX_ITALIC: LatexTextFormatTransformer = {
  type: 'text-format',
  format: 'italic',
  command: 'textit',
  aliases: ['emph', 'it', 'itshape', 'textsl'],
};

export const LATEX_UNDERLINE: LatexTextFormatTransformer = {
  type: 'text-format',
  format: 'underline',
  command: 'underline',
  aliases: ['uline'],
};

export const LATEX_STRIKETHROUGH: LatexTextFormatTransformer = {
  type: 'text-format',
  format: 'strikethrough',
  command: 'sout',
  aliases: ['st'],
};

export const LATEX_SUPERSCRIPT: LatexTextFormatTransformer = {
  type: 'text-format',
  format: 'superscript',
  command: 'textsuperscript',
};

export const LATEX_SUBSCRIPT: LatexTextFormatTransformer = {
  type: 'text-format',
  format: 'subscript',
  command: 'textsubscript',
};

export const LATEX_HIGHLIGHT: LatexTextFormatTransformer = {
  type: 'text-format',
  format: 'highlight',
  command: 'hl',
};

// ─── Text match transformers ───────────────────────────────────────────────

export const LATEX_INLINE_EQUATION: LatexTextMatchTransformer = {
  type: 'text-match',
  dependencies: [EquationNode],
  export: node => {
    if (!$isEquationNode(node)) {
      return null;
    }
    return node.__inline
      ? `$${node.getEquation()}$`
      : `\\[${node.getEquation()}\\]`;
  },
  importMath: (equation, display) => $createEquationNode(equation, !display),
};

export const LATEX_IMAGE: LatexTextMatchTransformer = {
  type: 'text-match',
  dependencies: [ImageNode],
  export: node =>
    $isImageNode(node)
      ? `\\includegraphics[width=\\linewidth]{${node.getSrc()}}`
      : null,
  importCommand: {
    names: ['includegraphics'],
    replace: args =>
      args[0]
        ? $createImageNode({ altText: '', maxWidth: 800, src: args[0].trim() })
        : null,
  },
};

export const LATEX_LINK: LatexTextMatchTransformer = {
  type: 'text-match',
  dependencies: [LinkNode, AutoLinkNode],
  export: (node, { exportChildren }) =>
    $isLinkNode(node)
      ? `\\href{${node.getURL()}}{${exportChildren(node)}}`
      : null,
  importCommand: {
    names: ['href', 'url'],
    replace: (args, _options, { importInline }) => {
      const url = (args[0] ?? '').trim();
      if (!url) {
        return null;
      }
      const link = $createLinkNode(url);
      const label = args.length > 1 ? args[1] : url;
      link.append(...importInline(label));
      return link;
    },
  },
};

// ─── Sets ──────────────────────────────────────────────────────────────────

export const LATEX_ELEMENT_TRANSFORMERS: LatexElementTransformer[] = [
  LATEX_HEADING,
  LATEX_QUOTE,
  LATEX_LIST,
  LATEX_JUPYTER_INPUT,
  LATEX_JUPYTER_OUTPUT,
  LATEX_CODE,
  LATEX_TABLE,
  LATEX_FLOAT,
  LATEX_FIGURE,
  LATEX_DISPLAY_EQUATION,
  LATEX_HORIZONTAL_RULE,
  LATEX_YOUTUBE,
  LATEX_COLLAPSIBLE,
];

export const LATEX_TEXT_FORMAT_TRANSFORMERS: LatexTextFormatTransformer[] = [
  LATEX_CODE_FORMAT,
  LATEX_BOLD,
  LATEX_ITALIC,
  LATEX_UNDERLINE,
  LATEX_STRIKETHROUGH,
  LATEX_SUPERSCRIPT,
  LATEX_SUBSCRIPT,
  LATEX_HIGHLIGHT,
];

export const LATEX_TEXT_MATCH_TRANSFORMERS: LatexTextMatchTransformer[] = [
  LATEX_INLINE_EQUATION,
  LATEX_IMAGE,
  LATEX_LINK,
];

export const LATEX_TRANSFORMERS: LatexTransformer[] = [
  ...LATEX_ELEMENT_TRANSFORMERS,
  ...LATEX_TEXT_FORMAT_TRANSFORMERS,
  ...LATEX_TEXT_MATCH_TRANSFORMERS,
];

/** Transformers sorted by kind, the shape both walks consume. */
export function latexTransformersByType(transformers: LatexTransformer[]) {
  return {
    element: transformers.filter(
      (t): t is LatexElementTransformer => t.type === 'element',
    ),
    textFormat: transformers.filter(
      (t): t is LatexTextFormatTransformer => t.type === 'text-format',
    ),
    textMatch: transformers.filter(
      (t): t is LatexTextMatchTransformer => t.type === 'text-match',
    ),
  };
}
