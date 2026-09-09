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
  $isTextNode,
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
  $createCollapsibleContainerNode,
  $isCollapsibleContainerNode,
  CollapsibleContainerNode,
} from '../../plugins/CollapsiblePlugin/CollapsibleContainerNode';
import { $createCollapsibleTitleNode } from '../../plugins/CollapsiblePlugin/CollapsibleTitleNode';
import { $createCollapsibleContentNode } from '../../plugins/CollapsiblePlugin/CollapsibleContentNode';
import {
  $createLayoutContainerNode,
  $isLayoutContainerNode,
  LayoutContainerNode,
} from '../../nodes/LayoutContainerNode';
import {
  $createLayoutItemNode,
  $isLayoutItemNode,
  LayoutItemNode,
} from '../../nodes/LayoutItemNode';
import {
  capitalize,
  escapeLatex,
  readBraceArgument,
  readBraceArguments,
  readOption,
} from './utils';

// ─── Types ─────────────────────────────────────────────────────────────────

/** What a transformer may call while exporting. */
export interface LatexExportContext {
  /** The inline content of an element: its text, formats and inline nodes. */
  exportChildren: (node: ElementNode) => string;
  /** A block on its own, through the element transformers. */
  exportBlock: (node: LexicalNode) => string | null;
  /** Several blocks, separated by blank lines. */
  exportBlocks: (nodes: LexicalNode[]) => string;
  /** The class has chapters (`book`, `report`): an `h1` is a `\chapter`. */
  chapters: boolean;
}

/** A macro the source defines with `\newcommand`. */
export interface LatexMacro {
  name: string;
  arity: number;
  /** The default of the first argument when it is optional. */
  defaultArg: string | null;
  body: string;
}

/** What a preamble says about a document. */
export interface LatexDocumentInfo {
  documentClass: string | null;
  classOptions: string[];
  title: string | null;
  subtitle: string | null;
  author: string | null;
  date: string | null;
  /** beamer */
  institute: string | null;
  /** letter, moderncv */
  address: string | null;
  /** letter */
  signature: string | null;
  /** moderncv */
  name: string | null;
  phone: string | null;
  email: string | null;
  homepage: string | null;
  macros: LatexMacro[];
}

/** What a transformer may call, and see, while importing. */
export interface LatexImportContext {
  /** Blocks out of a piece of LaTeX (a list item's body, a quote's body). */
  importBlocks: (latex: string) => LexicalNode[];
  /** Inline nodes out of a piece of LaTeX (a heading's title, a cell). */
  importInline: (latex: string) => LexicalNode[];
  /** What the preamble said; a transformer may add to it (`\title` in the body). */
  document: LatexDocumentInfo;
  /** The relative width a column asked for, for the layout that joins columns. */
  columnWeights: WeakMap<LexicalNode, number>;
  /** The document has chapters: `\section` is one level down. */
  chapters: boolean;
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

/** Classes whose top-level heading is `\chapter`. */
export const CHAPTER_CLASSES = new Set([
  'book',
  'report',
  'memoir',
  'scrbook',
  'scrreprt',
  'amsbook',
  'thesis',
  'mitthesis',
  'phdthesis',
  'bookest',
]);

/** Whether `\chapter` is the top level: by class, or because the body uses it. */
export function hasChapters(
  documentClass: string | null | undefined,
  body?: string,
): boolean {
  return (
    CHAPTER_CLASSES.has((documentClass ?? '').toLowerCase()) ||
    (body !== undefined && /(?<!\\)\\chapter\b/.test(body))
  );
}

/** `h1` → `\section` … in a class without chapters. */
const HEADING_COMMANDS: Record<HeadingTagType, string> = {
  h1: 'section',
  h2: 'subsection',
  h3: 'subsubsection',
  h4: 'paragraph',
  h5: 'subparagraph',
  h6: 'subparagraph',
};

/** `h1` → `\chapter` … in a class with chapters. */
const CHAPTER_HEADING_COMMANDS: Record<HeadingTagType, string> = {
  h1: 'chapter',
  h2: 'section',
  h3: 'subsection',
  h4: 'subsubsection',
  h5: 'paragraph',
  h6: 'subparagraph',
};

const HEADING_TAGS: Record<string, HeadingTagType> = {
  part: 'h1',
  chapter: 'h1',
  section: 'h1',
  subsection: 'h2',
  subsubsection: 'h3',
  paragraph: 'h4',
  subparagraph: 'h5',
};

const CHAPTER_HEADING_TAGS: Record<string, HeadingTagType> = {
  part: 'h1',
  chapter: 'h1',
  section: 'h2',
  subsection: 'h3',
  subsubsection: 'h4',
  paragraph: 'h5',
  subparagraph: 'h6',
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
        // eslint-disable-next-line no-control-regex
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
  export: (node, ctx) => {
    if (!$isHeadingNode(node)) {
      return null;
    }
    const commands = ctx.chapters ? CHAPTER_HEADING_COMMANDS : HEADING_COMMANDS;
    const command = commands[node.getTag()] ?? 'section';
    return `\\${command}{${ctx.exportChildren(node)}}`;
  },
  import: {
    kind: 'line',
    regExp:
      /^\\(part|chapter|section|subsection|subsubsection|paragraph|subparagraph)\*?\s*(?:\[[^\]]*\])?\s*\{/,
    replace: (match, line, { importInline, chapters }) => {
      const argument = readBraceArgument(line, match[0].length - 1);
      const tags = chapters ? CHAPTER_HEADING_TAGS : HEADING_TAGS;
      const heading = $createHeadingNode(tags[match[1]] ?? 'h1');
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
  describing = false,
): ListNode {
  const list = $createListNode(listType);
  const items = splitTopLevel(body, '\\item').slice(1);
  for (const raw of items) {
    let text = raw;
    let checked: boolean | undefined;
    let term: string | null = null;
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
      } else if (describing || label) {
        // `\item[Term] text`: the term leads, in bold.
        term = label;
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
    if (term) {
      item.append(...ctx.importInline(term).map($bolden), $createTextNode(' '));
    }
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

/** `node` in bold, when it is text. */
function $bolden(node: LexicalNode): LexicalNode {
  if ($isTextNode(node) && !node.hasFormat('bold')) {
    node.toggleFormat('bold');
  }
  return node;
}

/** `node` in italics, when it is text. */
function $italicize(node: LexicalNode): LexicalNode {
  if ($isTextNode(node) && !node.hasFormat('italic')) {
    node.toggleFormat('italic');
  }
  return node;
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
      return [
        importListItems(
          block.body,
          listType,
          ctx,
          block.name === 'description',
        ),
      ];
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
    regExp:
      /^(\\noindent\s*)?(\\hrulefill|\\hrule|\\rule\{[^}]*\}\{[^}]*\}|\\hline)$/,
    replace: () => [$createHorizontalRuleNode() as unknown as LexicalNode],
  },
};

function exportTable(table: TableNode, ctx: LatexExportContext): string {
  const rows = table.getChildren().filter($isTableRowNode) as TableRowNode[];
  const span = (cell: TableCellNode) => Math.max(1, cell.getColSpan());
  const columns = Math.max(
    1,
    ...rows.map(row =>
      (row.getChildren().filter($isTableCellNode) as TableCellNode[]).reduce(
        (sum, cell) => sum + span(cell),
        0,
      ),
    ),
  );
  const lines = [`\\begin{tabular}{|${'l|'.repeat(columns)}}`, '\\hline'];
  rows.forEach((row, rowIndex) => {
    const cells = row.getChildren().filter($isTableCellNode) as TableCellNode[];
    const isHeader =
      cells.length > 0 &&
      cells.every(cell => cell.hasHeaderState(TableCellHeaderStates.ROW));
    const content = cells.map(cell => {
      const text = cell
        .getChildren()
        .map(child =>
          $isElementNode(child)
            ? ctx.exportChildren(child)
            : ctx.exportBlock(child),
        )
        .filter(Boolean)
        .join(' ');
      return span(cell) > 1 ? `\\multicolumn{${span(cell)}}{l}{${text}}` : text;
    });
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
      let content = cellText.trim();
      let colSpan = 1;
      // `\multicolumn{2}{c}{Text}`: a cell over two columns.
      const multi = /^\\multicolumn\s*\{/.exec(content);
      if (multi) {
        const args = readBraceArguments(content, multi[0].length - 1, 3);
        colSpan = Math.max(1, Number(args.values[0]) || 1);
        content = args.values[2] ?? '';
      }
      const cell = $createTableCellNode(
        rowIndex === 0 && firstIsHeader
          ? TableCellHeaderStates.ROW
          : TableCellHeaderStates.NO_STATUS,
        colSpan,
      );
      const paragraph = $createParagraphNode();
      paragraph.append(...ctx.importInline(content));
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
    names: [
      'table',
      'table*',
      'center',
      'flushleft',
      'flushright',
      'titlepage',
    ],
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

// ─── Documents, columns and the classes' own blocks ────────────────────────

/** A grid template for columns of the given relative widths. */
export function columnsTemplate(weights: number[]): string {
  const total =
    weights.reduce((sum, weight) => sum + weight, 0) || weights.length;
  return weights
    .map(weight => `${Math.max(1, Math.round((weight / total) * 100))}fr`)
    .join(' ');
}

/** A column holding `blocks` (a paragraph when there are none). */
export function $columnOf(blocks: LexicalNode[]): LayoutItemNode {
  const item = $createLayoutItemNode();
  item.append(...(blocks.length > 0 ? blocks : [$createParagraphNode()]));
  return item;
}

/** A layout holding `items` as columns of the given relative widths. */
export function $columnsOf(
  items: LayoutItemNode[],
  weights: number[],
): LayoutContainerNode {
  const container = $createLayoutContainerNode(columnsTemplate(weights));
  for (const item of items) {
    if (item.isEmpty()) {
      item.append($createParagraphNode());
    }
    container.append(item);
  }
  return container;
}

/** `blocks` dealt into `count` columns of about equal length. */
export function $splitBlocks(
  blocks: LexicalNode[],
  count: number,
): LexicalNode[][] {
  const size = Math.max(1, Math.ceil(blocks.length / count));
  const parts: LexicalNode[][] = [];
  for (let i = 0; i < count; i++) {
    parts.push(blocks.slice(i * size, (i + 1) * size));
  }
  return parts;
}

/** The share of the line a width such as `0.3\textwidth` takes; 1 when unknown. */
function widthWeight(width: string | null): number {
  if (!width) {
    return 1;
  }
  const match =
    /^\s*([0-9]*\.?[0-9]+)?\s*\\(?:text|line|column|paper)width/.exec(width);
  if (match) {
    return match[1] ? Number(match[1]) : 1;
  }
  return 1;
}

function $paragraphOf(nodes: LexicalNode[]) {
  const paragraph = $createParagraphNode();
  paragraph.append(...nodes);
  return paragraph;
}

/** The title block `\maketitle` prints, from what the preamble said. */
export function $titleBlock(
  document: LatexDocumentInfo,
  ctx: LatexImportContext,
): LexicalNode[] {
  const nodes: LexicalNode[] = [];
  const heading = (tag: HeadingTagType, text: string) => {
    const node = $createHeadingNode(tag);
    node.append(...ctx.importInline(text));
    nodes.push(node);
  };
  if (document.name) {
    // A CV: the person is the title, the role the subtitle.
    heading('h1', document.name);
    if (document.title) {
      heading('h3', document.title);
    }
  } else if (document.title) {
    heading('h1', document.title);
    if (document.subtitle) {
      heading('h3', document.subtitle);
    }
  }
  if (document.author) {
    const author = document.author.replace(/\s*\\and\b\s*/g, ', ');
    nodes.push($paragraphOf(ctx.importInline(author).map($italicize)));
  }
  if (document.institute) {
    nodes.push($paragraphOf(ctx.importInline(document.institute)));
  }
  if (document.date) {
    nodes.push($paragraphOf(ctx.importInline(document.date)));
  }
  const contact = [
    document.address,
    document.phone,
    document.email,
    document.homepage,
  ]
    .filter((part): part is string => !!part)
    .join(' · ');
  if (contact) {
    nodes.push($paragraphOf(ctx.importInline(contact)));
  }
  return nodes;
}

/** `\title{…}`, `\author{…}`, `\date{…}` in the body: noted, not shown. */
export const LATEX_META: LatexElementTransformer = {
  type: 'element',
  dependencies: [],
  export: () => null,
  import: {
    kind: 'line',
    regExp: /^\\(title|subtitle|author|date|institute)\s*(?:\[[^\]]*\])?\s*\{/,
    replace: (match, line, ctx) => {
      const key = match[1] as
        'title' | 'subtitle' | 'author' | 'date' | 'institute';
      const argument = readBraceArgument(line, match[0].length - 1);
      if (argument) {
        ctx.document[key] = argument.value;
      }
      return [];
    },
  },
};

/** `\maketitle` and its relatives: the title block. */
export const LATEX_TITLE: LatexElementTransformer = {
  type: 'element',
  dependencies: [HeadingNode],
  export: () => null,
  import: {
    kind: 'line',
    regExp: /^\\(maketitle|titlepage|makecvtitle|maketitlepage)(?![A-Za-z])/,
    replace: (_match, _line, ctx) => $titleBlock(ctx.document, ctx),
  },
};

/**
 * Columns: `multicols`, beamer's `columns`/`column`, side-by-side
 * `minipage`s. A single `column` or `minipage` comes back as one column;
 * the importer joins neighbours into a layout, or unwraps a lone one.
 */
export const LATEX_COLUMNS: LatexElementTransformer = {
  type: 'element',
  dependencies: [LayoutContainerNode, LayoutItemNode],
  export: (node, ctx) => {
    if ($isLayoutContainerNode(node)) {
      const items = node
        .getChildren()
        .filter($isLayoutItemNode) as LayoutItemNode[];
      const columns = items.map(item => ctx.exportBlocks(item.getChildren()));
      return `\\begin{multicols}{${Math.max(1, items.length)}}\n${columns.join(
        '\n\\columnbreak\n',
      )}\n\\end{multicols}`;
    }
    if ($isLayoutItemNode(node)) {
      return ctx.exportBlocks(node.getChildren());
    }
    return null;
  },
  import: {
    kind: 'environment',
    names: [
      'multicols',
      'multicols*',
      'columns',
      'column',
      'minipage',
      'paracol',
    ],
    replace: (block, ctx) => {
      if (block.name.startsWith('multicols') || block.name === 'paracol') {
        const count = Math.max(1, Number(block.argument) || 2);
        const parts = splitTopLevel(block.body, '\\columnbreak');
        const columns =
          parts.length > 1
            ? parts.map(part => ctx.importBlocks(part))
            : $splitBlocks(ctx.importBlocks(block.body), count);
        return [
          $columnsOf(
            columns.map($columnOf),
            columns.map(() => 1),
          ),
        ];
      }
      if (block.name === 'columns') {
        if (
          /\\column\s*\{/.test(block.body) &&
          !/\\begin\{column\}/.test(block.body)
        ) {
          // `\column{width}` cuts the body; the environment form is read below.
          const parts = block.body.split(/\\column\s*\{([^}]*)\}/).slice(1);
          const items: LayoutItemNode[] = [];
          const weights: number[] = [];
          for (let i = 0; i + 1 < parts.length; i += 2) {
            items.push($columnOf(ctx.importBlocks(parts[i + 1])));
            weights.push(widthWeight(parts[i]));
          }
          return items.length > 0 ? [$columnsOf(items, weights)] : [];
        }
        return ctx.importBlocks(block.body);
      }
      const item = $columnOf(ctx.importBlocks(block.body));
      ctx.columnWeights.set(item, widthWeight(block.argument));
      return [item];
    },
  },
};

const THEOREM_NAMES = [
  'theorem',
  'lemma',
  'proposition',
  'corollary',
  'definition',
  'example',
  'remark',
  'claim',
  'exercise',
  'solution',
  'note',
  'conjecture',
  'proof',
];

/** Theorem-like environments: a quote led by the bold name. */
export const LATEX_THEOREM: LatexElementTransformer = {
  type: 'element',
  dependencies: [QuoteNode],
  export: () => null,
  import: {
    kind: 'environment',
    names: THEOREM_NAMES.flatMap(name => [name, `${name}*`]),
    replace: (block, ctx) => {
      const base = block.name.replace(/\*$/, '');
      const { inline, rest } = inlineNodesOf(ctx.importBlocks(block.body));
      const quote = $createQuoteNode();
      const label = $createTextNode(
        base === 'proof'
          ? 'Proof.'
          : `${capitalize(base)}${block.options ? ` (${block.options})` : ''}.`,
      );
      label.toggleFormat(base === 'proof' ? 'italic' : 'bold');
      quote.append(label, $createTextNode(' '), ...inline);
      if (base === 'proof') {
        quote.append($createTextNode(' ∎'));
      }
      return [quote, ...rest];
    },
  },
};

/** `thebibliography`: a References heading and a numbered list. */
export const LATEX_BIBLIOGRAPHY: LatexElementTransformer = {
  type: 'element',
  dependencies: [ListNode, ListItemNode, HeadingNode],
  export: () => null,
  import: {
    kind: 'environment',
    names: ['thebibliography'],
    replace: (block, ctx) => {
      const list = $createListNode('number');
      for (const raw of splitTopLevel(block.body, '\\bibitem').slice(1)) {
        let text = raw;
        const optional = /^\s*\[/.test(text) ? readBraceLikeOption(text) : null;
        if (optional) {
          text = text.slice(optional.end);
        }
        const key = readBraceArgument(text, 0);
        if (key) {
          text = text.slice(key.end);
        }
        const item = $createListItemNode();
        item.append(...ctx.importInline(text.trim()));
        list.append(item);
      }
      const heading = $createHeadingNode('h2');
      heading.append($createTextNode('References'));
      return [heading, list];
    },
  },
};

/** A beamer frame: its title as a heading, then its content. */
export const LATEX_FRAME: LatexElementTransformer = {
  type: 'element',
  dependencies: [HeadingNode],
  export: () => null,
  import: {
    kind: 'environment',
    names: ['frame'],
    replace: (block, ctx) => {
      const nodes: LexicalNode[] = [];
      if (block.argument && block.argument.trim()) {
        const heading = $createHeadingNode('h2');
        heading.append(...ctx.importInline(block.argument));
        nodes.push(heading);
      }
      nodes.push(...ctx.importBlocks(block.body));
      return nodes;
    },
  },
};

/** `\frametitle{…}` inside a frame. */
export const LATEX_FRAME_TITLE: LatexElementTransformer = {
  type: 'element',
  dependencies: [HeadingNode],
  export: () => null,
  import: {
    kind: 'line',
    regExp: /^\\(frametitle|framesubtitle)\s*\{/,
    replace: (match, line, ctx) => {
      const argument = readBraceArgument(line, match[0].length - 1);
      const heading = $createHeadingNode(
        match[1] === 'frametitle' ? 'h2' : 'h3',
      );
      heading.append(...ctx.importInline(argument ? argument.value : ''));
      return [heading];
    },
  },
};

/** A titled box — beamer's blocks, `tcolorbox` — as an open collapsible. */
export const LATEX_BLOCK: LatexElementTransformer = {
  type: 'element',
  dependencies: [CollapsibleContainerNode],
  export: () => null,
  import: {
    kind: 'environment',
    names: [
      'block',
      'alertblock',
      'exampleblock',
      'tcolorbox',
      'mdframed',
      'infobox',
    ],
    replace: (block, ctx) => {
      const title =
        (block.argument && block.argument.trim()) ||
        readOption(block.options, 'title') ||
        capitalize(block.name.replace(/block$/, '') || 'note');
      const container = $createCollapsibleContainerNode(true);
      const titleNode = $createCollapsibleTitleNode();
      titleNode.append(...ctx.importInline(title));
      const content = $createCollapsibleContentNode();
      const blocks = ctx.importBlocks(block.body);
      content.append(
        ...(blocks.length > 0 ? blocks : [$createParagraphNode()]),
      );
      container.append(titleNode, content);
      return [container];
    },
  },
};

/** The `letter` environment: the recipient, then the letter. */
export const LATEX_LETTER: LatexElementTransformer = {
  type: 'element',
  dependencies: [],
  export: () => null,
  import: {
    kind: 'environment',
    names: ['letter'],
    replace: (block, ctx) => {
      const nodes: LexicalNode[] = [];
      if (block.argument && block.argument.trim()) {
        nodes.push($paragraphOf(ctx.importInline(block.argument)));
      }
      nodes.push(...ctx.importBlocks(block.body));
      return nodes;
    },
  },
};

/** A letter's `\opening`, `\closing` (with the signature), `\ps`, `\encl`, `\cc`. */
export const LATEX_LETTER_LINES: LatexElementTransformer = {
  type: 'element',
  dependencies: [],
  export: () => null,
  import: {
    kind: 'line',
    regExp: /^\\(opening|closing|ps|encl|cc)\s*\{/,
    replace: (match, line, ctx) => {
      const argument = readBraceArgument(line, match[0].length - 1);
      const text = argument ? argument.value : '';
      const labels: Record<string, string> = {
        cc: 'cc: ',
        encl: 'Enclosures: ',
        ps: 'P.S. ',
      };
      const nodes: LexicalNode[] = [];
      if (labels[match[1]]) {
        const label = $createTextNode(labels[match[1]]);
        label.toggleFormat('bold');
        nodes.push($paragraphOf([label, ...ctx.importInline(text)]));
      } else {
        nodes.push($paragraphOf(ctx.importInline(text)));
      }
      if (match[1] === 'closing' && ctx.document.signature) {
        nodes.push(
          $paragraphOf(ctx.importInline(ctx.document.signature).map($bolden)),
        );
      }
      return nodes;
    },
  },
};

/** moderncv's entries: `\cventry`, `\cvitem`, `\cvitemwithcomment`, `\cvlistitem`, `\cvdoubleitem`. */
export const LATEX_CV: LatexElementTransformer = {
  type: 'element',
  dependencies: [ListNode, ListItemNode],
  export: () => null,
  import: {
    kind: 'line',
    regExp:
      /^\\(cventry|cvitem|cvitemwithcomment|cvlistitem|cvlistdoubleitem|cvdoubleitem)\s*\{/,
    replace: (match, line, ctx) => {
      const start = match[0].length - 1;
      const inline = (text: string) => ctx.importInline(text);
      switch (match[1]) {
        case 'cventry': {
          const [years, title, institution, city, grade, description] =
            readBraceArguments(line, start, 6).values;
          const parts: LexicalNode[] = [...inline(title ?? '').map($bolden)];
          const where = [institution, city].filter(Boolean).join(', ');
          if (where) {
            parts.push($createTextNode(' — '), ...inline(where));
          }
          if (years) {
            parts.push(
              $createTextNode(' ('),
              ...inline(years),
              $createTextNode(')'),
            );
          }
          if (grade) {
            parts.push($createTextNode(', '), ...inline(grade).map($italicize));
          }
          if (description) {
            parts.push($createLineBreakNode(), ...inline(description));
          }
          return [$paragraphOf(parts)];
        }
        case 'cvitem':
        case 'cvitemwithcomment': {
          const [label, text, comment] = readBraceArguments(
            line,
            start,
            3,
          ).values;
          const parts: LexicalNode[] = [];
          if (label) {
            parts.push(...inline(`${label}: `).map($bolden));
          }
          parts.push(...inline(text ?? ''));
          if (comment) {
            parts.push(
              $createTextNode(' — '),
              ...inline(comment).map($italicize),
            );
          }
          return [$paragraphOf(parts)];
        }
        case 'cvdoubleitem': {
          const [a, b, c, d] = readBraceArguments(line, start, 4).values;
          const parts: LexicalNode[] = [];
          if (a) {
            parts.push(...inline(`${a}: `).map($bolden));
          }
          parts.push(...inline(b ?? ''));
          if (c) {
            parts.push(
              $createTextNode(' · '),
              ...inline(`${c}: `).map($bolden),
            );
          }
          parts.push(...inline(d ?? ''));
          return [$paragraphOf(parts)];
        }
        default: {
          // cvlistitem, cvlistdoubleitem: bullets, joined by the importer.
          const list = $createListNode('bullet');
          for (const text of readBraceArguments(line, start, 2).values) {
            const item = $createListItemNode();
            item.append(...inline(text));
            list.append(item);
          }
          return [list];
        }
      }
    },
  },
};

/** Algorithms as code; a TikZ picture as a note that one was there. */
export const LATEX_ALGORITHM: LatexElementTransformer = {
  type: 'element',
  dependencies: [CodeNode],
  export: () => null,
  import: {
    kind: 'environment',
    names: [
      'algorithm',
      'algorithm*',
      'algorithmic',
      'algorithm2e',
      'tikzpicture',
      'circuitikz',
    ],
    replace: block => {
      if (block.name === 'tikzpicture' || block.name === 'circuitikz') {
        const note = $createTextNode('[TikZ picture]');
        note.toggleFormat('italic');
        return [$paragraphOf([note])];
      }
      const code = $createCodeNode();
      code.append($createTextNode(codeBody(block.body).trim()));
      return [code];
    },
  },
};

// ─── Sets ──────────────────────────────────────────────────────────────────

export const LATEX_ELEMENT_TRANSFORMERS: LatexElementTransformer[] = [
  LATEX_META,
  LATEX_TITLE,
  LATEX_HEADING,
  LATEX_FRAME_TITLE,
  LATEX_QUOTE,
  LATEX_THEOREM,
  LATEX_LIST,
  LATEX_BIBLIOGRAPHY,
  LATEX_JUPYTER_INPUT,
  LATEX_JUPYTER_OUTPUT,
  LATEX_CODE,
  LATEX_ALGORITHM,
  LATEX_TABLE,
  LATEX_FLOAT,
  LATEX_FIGURE,
  LATEX_DISPLAY_EQUATION,
  LATEX_HORIZONTAL_RULE,
  LATEX_YOUTUBE,
  LATEX_COLUMNS,
  LATEX_FRAME,
  LATEX_BLOCK,
  LATEX_LETTER,
  LATEX_LETTER_LINES,
  LATEX_CV,
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
