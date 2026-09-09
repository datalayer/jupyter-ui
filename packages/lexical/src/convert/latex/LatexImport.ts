/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * LaTeX → Lexical.
 *
 * Two passes, both driven by the transformers. Blocks first: the source is
 * cut at environments and display math, the text between them at blank
 * lines and at the line commands the transformers declare (headings,
 * rules); an environment goes to the transformer that owns it, an unknown
 * one is opened and its body read as blocks. Then inline: a paragraph's text
 * is parsed left to right into text nodes carrying the formats the
 * text-format transformers map from commands, with inline math and the
 * commands the text-match transformers own becoming nodes. Escapes, groups,
 * `\verb`, comments and the usual spacing commands are handled here since
 * they belong to no node.
 *
 * @module convert/latex/LatexImport
 */

import type { LexicalNode, TextFormatType } from 'lexical';
import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  IS_BOLD,
  IS_CODE,
  IS_HIGHLIGHT,
  IS_ITALIC,
  IS_STRIKETHROUGH,
  IS_SUBSCRIPT,
  IS_SUPERSCRIPT,
  IS_UNDERLINE,
} from 'lexical';
import {
  LATEX_TRANSFORMERS,
  latexTransformersByType,
  type LatexBlockImport,
  type LatexEnvironmentBlock,
  type LatexImportContext,
  type LatexTextMatchTransformer,
  type LatexTransformer,
} from './LatexTransformers';
import {
  extractDocumentBody,
  findClosingBrace,
  readBraceArgument,
  readOptionalArgument,
  stripComments,
} from './utils';

const FORMAT_BITS: Record<TextFormatType, number> = {
  bold: IS_BOLD,
  italic: IS_ITALIC,
  underline: IS_UNDERLINE,
  strikethrough: IS_STRIKETHROUGH,
  code: IS_CODE,
  subscript: IS_SUBSCRIPT,
  superscript: IS_SUPERSCRIPT,
  highlight: IS_HIGHLIGHT,
  lowercase: 0,
  uppercase: 0,
  capitalize: 0,
};

/** Commands that shape a page but carry no content. */
const SKIPPED_LINE =
  /^\\(maketitle|tableofcontents|listoffigures|listoftables|newpage|clearpage|pagebreak|bigskip|medskip|smallskip|centering|noindent|vfill|hfill|vspace\*?\{[^}]*\}|label\{[^}]*\}|setlength\{[^}]*\}\{[^}]*\})$/;

/** Environments whose body is code: read verbatim, never as LaTeX. */
const VERBATIM_ENVIRONMENTS = new Set([
  'verbatim',
  'Verbatim',
  'lstlisting',
  'minted',
  'alltt',
  'pythoncode',
  'code',
]);

/** Environments that take brace arguments after `\begin{name}`. */
const ENVIRONMENT_ARGUMENTS: Record<string, number> = {
  tabular: 1,
  tabularx: 2,
  tabulary: 2,
  longtable: 1,
  minted: 1,
  wrapfigure: 2,
  minipage: 1,
};

type EnvironmentImport = Extract<LatexBlockImport, { kind: 'environment' }>;
type LineImport = Extract<LatexBlockImport, { kind: 'line' }>;

/**
 * A function that, called inside an editor update, appends the nodes read
 * from a LaTeX source to the root. Clear the root first to replace.
 */
export function createLatexImport(
  transformers: LatexTransformer[] = LATEX_TRANSFORMERS,
): (latex: string) => void {
  const byType = latexTransformersByType(transformers);

  const environments = new Map<string, EnvironmentImport>();
  const lines: LineImport[] = [];
  for (const transformer of byType.element) {
    const spec = transformer.import;
    if (!spec) {
      continue;
    }
    if (spec.kind === 'environment') {
      for (const name of spec.names) {
        environments.set(name, spec);
      }
    } else {
      lines.push(spec);
    }
  }

  const formats = new Map<string, number>();
  for (const transformer of byType.textFormat) {
    const bits = FORMAT_BITS[transformer.format];
    formats.set(transformer.command, bits);
    for (const alias of transformer.aliases ?? []) {
      formats.set(alias, bits);
    }
  }

  const commands = new Map<
    string,
    NonNullable<LatexTextMatchTransformer['importCommand']>
  >();
  for (const transformer of byType.textMatch) {
    for (const name of transformer.importCommand?.names ?? []) {
      commands.set(name, transformer.importCommand!);
    }
  }
  const math = byType.textMatch.find(transformer => transformer.importMath);

  const $math = (equation: string, display: boolean): LexicalNode =>
    math?.importMath
      ? math.importMath(equation, display)
      : $createTextNode(display ? `\\[${equation}\\]` : `$${equation}$`);

  // ── Blocks ────────────────────────────────────────────────────────────

  const importBlocks = (text: string): LexicalNode[] => {
    const nodes: LexicalNode[] = [];
    // An escaped `\$` or `\[` is text, not a delimiter.
    const structural =
      /(?<!\\)\\begin\{([A-Za-z*]+)\}|(?<!\\)\\\[|(?<!\\)\$\$/g;
    let cursor = 0;
    while (cursor < text.length) {
      structural.lastIndex = cursor;
      const match = structural.exec(text);
      const upTo = match ? match.index : text.length;
      nodes.push(...importTextChunk(text.slice(cursor, upTo)));
      if (!match) {
        break;
      }
      if (match[1]) {
        const environment = readEnvironment(text, match.index, match[1]);
        if (!environment) {
          // No matching \end: the rest is text.
          nodes.push(...importTextChunk(text.slice(match.index)));
          break;
        }
        const handler = environments.get(match[1]);
        nodes.push(
          ...(handler
            ? handler.replace(environment.block, ctx)
            : importBlocks(environment.block.body)),
        );
        cursor = environment.end;
      } else {
        const open = match[0];
        const close = open === '\\[' ? '\\]' : '$$';
        const start = match.index + open.length;
        const end = text.indexOf(close, start);
        const body = end === -1 ? text.slice(start) : text.slice(start, end);
        const paragraph = $createParagraphNode();
        paragraph.append($math(body.trim(), true));
        nodes.push(paragraph);
        cursor = end === -1 ? text.length : end + close.length;
      }
    }
    return nodes;
  };

  const readEnvironment = (
    text: string,
    beginIndex: number,
    name: string,
  ): { block: LatexEnvironmentBlock; end: number } | null => {
    let i = beginIndex + `\\begin{${name}}`.length;
    let options: string | null = null;
    const optional = readOptionalArgument(text, i);
    if (optional) {
      options = optional.value;
      i = optional.end;
    }
    let argument: string | null = null;
    for (let n = 0; n < (ENVIRONMENT_ARGUMENTS[name] ?? 0); n++) {
      const arg = readBraceArgument(text, i);
      if (!arg) {
        break;
      }
      // The last argument is the one that matters (columns, language).
      argument = arg.value;
      i = arg.end;
    }
    const begin = `\\begin{${name}}`;
    const end = `\\end{${name}}`;
    let depth = 1;
    let position = i;
    while (depth > 0) {
      const nextEnd = text.indexOf(end, position);
      if (nextEnd === -1) {
        return null;
      }
      const nextBegin = VERBATIM_ENVIRONMENTS.has(name)
        ? -1
        : text.indexOf(begin, position);
      if (nextBegin !== -1 && nextBegin < nextEnd) {
        depth++;
        position = nextBegin + begin.length;
      } else {
        depth--;
        if (depth === 0) {
          return {
            block: { argument, body: text.slice(i, nextEnd), name, options },
            end: nextEnd + end.length,
          };
        }
        position = nextEnd + end.length;
      }
    }
    return null;
  };

  const importTextChunk = (chunk: string): LexicalNode[] => {
    const nodes: LexicalNode[] = [];
    let paragraph: string[] = [];
    const flush = () => {
      const text = paragraph.join('\n').trim();
      paragraph = [];
      if (!text) {
        return;
      }
      const node = $createParagraphNode();
      node.append(...importInline(text));
      if (node.getChildrenSize() > 0) {
        nodes.push(node);
      }
    };
    for (const line of stripComments(chunk).split('\n')) {
      const trimmed = line.trim();
      if (trimmed === '') {
        flush();
        continue;
      }
      if (SKIPPED_LINE.test(trimmed)) {
        continue;
      }
      const handler = lines.find(candidate => candidate.regExp.test(trimmed));
      if (handler) {
        flush();
        const match = handler.regExp.exec(trimmed) as RegExpMatchArray;
        nodes.push(...handler.replace(match, trimmed, ctx));
        continue;
      }
      paragraph.push(line);
    }
    flush();
    return nodes;
  };

  // ── Inline ────────────────────────────────────────────────────────────

  const importInline = (text: string): LexicalNode[] =>
    // Inside a paragraph a newline is a space, and runs of spaces are one.
    parseInline(
      text.replace(/[ \t]*\n[ \t]*/g, ' ').replace(/[ \t]{2,}/g, ' '),
      0,
    );

  const parseInline = (text: string, format: number): LexicalNode[] => {
    const nodes: LexicalNode[] = [];
    let buffer = '';
    const flush = () => {
      if (buffer !== '') {
        const node = $createTextNode(buffer);
        if (format) {
          node.setFormat(format);
        }
        nodes.push(node);
        buffer = '';
      }
    };
    const pushAll = (more: LexicalNode[]) => {
      flush();
      nodes.push(...more);
    };

    let i = 0;
    while (i < text.length) {
      const ch = text[i];
      if (ch === '\\') {
        const next = text[i + 1];
        if (next === '\\') {
          pushAll([$createLineBreakNode()]);
          i += 2;
          const spacing = readOptionalArgument(text, i);
          if (spacing && text[i] === '[') {
            i = spacing.end;
          }
          // The break ends the line: what follows starts the next one.
          while (text[i] === ' ') {
            i++;
          }
          continue;
        }
        if (next === '(' || next === '[') {
          const close = next === '(' ? '\\)' : '\\]';
          const end = text.indexOf(close, i + 2);
          const equation =
            end === -1 ? text.slice(i + 2) : text.slice(i + 2, end);
          pushAll([$math(equation.trim(), next === '[')]);
          i = end === -1 ? text.length : end + 2;
          continue;
        }
        if (next !== undefined && '%$&#_{}'.includes(next)) {
          buffer += next;
          i += 2;
          continue;
        }
        if (next === '~' || next === '^') {
          buffer += next;
          i += 2;
          if (text.startsWith('{}', i)) {
            i += 2;
          }
          continue;
        }
        if (
          next === ' ' ||
          next === ',' ||
          next === ';' ||
          next === '!' ||
          next === '/'
        ) {
          buffer += next === '/' ? '' : ' ';
          i += 2;
          continue;
        }
        const command = /^\\([A-Za-z]+)\*?/.exec(text.slice(i));
        if (!command) {
          buffer += '\\';
          i++;
          continue;
        }
        const name = command[1];
        let j = i + command[0].length;

        const bits = formats.get(name);
        if (bits !== undefined) {
          const argument = readBraceArgument(text, j);
          if (argument) {
            pushAll(parseInline(argument.value, format | bits));
            i = argument.end;
          } else {
            // A switch (`\bfseries`): the rest of the group.
            pushAll(parseInline(text.slice(j), format | bits));
            i = text.length;
          }
          continue;
        }

        const handler = commands.get(name);
        if (handler) {
          let options: string | null = null;
          const optional = readOptionalArgument(text, j);
          if (optional) {
            options = optional.value;
            j = optional.end;
          }
          const args: string[] = [];
          let argument = readBraceArgument(text, j);
          while (argument && args.length < 2) {
            args.push(argument.value);
            j = argument.end;
            argument = readBraceArgument(text, j);
          }
          const node = handler.replace(args, options, ctx);
          pushAll(node ? [node] : []);
          i = j;
          continue;
        }

        switch (name) {
          case 'textbackslash':
            buffer += '\\';
            j = skipEmptyGroup(text, j);
            break;
          case 'newline':
          case 'linebreak':
            pushAll([$createLineBreakNode()]);
            while (text[j] === ' ') {
              j++;
            }
            break;
          case 'ldots':
          case 'dots':
          case 'textellipsis':
            buffer += '…';
            j = skipEmptyGroup(text, j);
            break;
          case 'LaTeX':
          case 'TeX':
            buffer += name;
            j = skipEmptyGroup(text, j);
            break;
          case 'quad':
          case 'qquad':
          case 'enspace':
            buffer += ' ';
            break;
          case 'verb': {
            const delimiter = text[j];
            const end = delimiter ? text.indexOf(delimiter, j + 1) : -1;
            if (end !== -1) {
              flush();
              const code = $createTextNode(text.slice(j + 1, end));
              code.setFormat(format | IS_CODE);
              nodes.push(code);
              j = end + 1;
            }
            break;
          }
          case 'footnote': {
            const argument = readBraceArgument(text, j);
            if (argument) {
              buffer += ' (';
              pushAll(parseInline(argument.value, format));
              buffer += ')';
              j = argument.end;
            }
            break;
          }
          case 'label':
          case 'ref':
          case 'eqref':
          case 'pageref':
          case 'cite':
          case 'index':
          case 'hspace':
          case 'vspace': {
            // References and spacing have no text; their argument goes too.
            const argument = readBraceArgument(text, j);
            if (argument) {
              j = argument.end;
            }
            break;
          }
          default: {
            // Any other command: keep what it wraps, lose the command.
            const argument = readBraceArgument(text, j);
            if (argument) {
              pushAll(parseInline(argument.value, format));
              j = argument.end;
            }
          }
        }
        i = j;
        continue;
      }
      if (ch === '$') {
        const end = findUnescaped(text, '$', i + 1);
        const equation = text.slice(i + 1, end === -1 ? undefined : end);
        pushAll([$math(equation.trim(), false)]);
        i = end === -1 ? text.length : end + 1;
        continue;
      }
      if (ch === '{') {
        const close = findClosingBrace(text, i);
        if (close === -1) {
          i++;
          continue;
        }
        pushAll(parseInline(text.slice(i + 1, close), format));
        i = close + 1;
        continue;
      }
      if (ch === '}') {
        i++;
        continue;
      }
      if (ch === '~') {
        buffer += ' ';
        i++;
        continue;
      }
      buffer += ch;
      i++;
    }
    flush();
    return nodes;
  };

  const ctx: LatexImportContext = { importBlocks, importInline };

  return (latex: string) => {
    const body = extractDocumentBody(latex);
    $getRoot().append(...importBlocks(body));
  };
}

function skipEmptyGroup(text: string, index: number): number {
  return text.startsWith('{}', index) ? index + 2 : index;
}

function findUnescaped(text: string, char: string, from: number): number {
  for (let i = from; i < text.length; i++) {
    if (text[i] === '\\') {
      i++;
      continue;
    }
    if (text[i] === char) {
      return i;
    }
  }
  return -1;
}

/**
 * Append the document read from `latex` to the root. Call inside
 * `editor.update()`; clear the root first to replace what is there.
 */
export function $convertFromLatexString(
  latex: string,
  transformers: LatexTransformer[] = LATEX_TRANSFORMERS,
): void {
  createLatexImport(transformers)(latex);
}
