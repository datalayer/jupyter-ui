/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * LaTeX → Lexical.
 *
 * Three passes, all driven by the transformers. The preamble first: the
 * document class and its options, the title, author and date, a letter's
 * signature and address, a CV's name and contact, and the macros the source
 * defines with `\newcommand`, which are expanded in the body before anything
 * else reads it. Blocks next: the body is cut at environments and display
 * math, the text between them at blank lines and at the line commands the
 * transformers declare (headings, rules, `\maketitle`, a CV entry); an
 * environment goes to the transformer that owns it, an unknown one is opened
 * and its body read as blocks. Then inline: a paragraph's text is parsed left
 * to right into text nodes carrying the formats the text-format transformers
 * map from commands, with inline math and the commands the text-match
 * transformers own becoming nodes. Escapes, groups, `\verb`, citations,
 * comments, the usual spacing commands and TeX's dashes and quotes are
 * handled here since they belong to no node.
 *
 * @module convert/latex/LatexImport
 */

import type { LexicalNode, TextFormatType } from 'lexical';
import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isParagraphNode,
  IS_BOLD,
  IS_CODE,
  IS_HIGHLIGHT,
  IS_ITALIC,
  IS_STRIKETHROUGH,
  IS_SUBSCRIPT,
  IS_SUPERSCRIPT,
  IS_UNDERLINE,
} from 'lexical';
import { $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';
import { $isListNode } from '@lexical/list';
import { $isLayoutItemNode } from '../../nodes/LayoutItemNode';
import {
  $columnOf,
  $columnsOf,
  $splitBlocks,
  LATEX_TRANSFORMERS,
  latexTransformersByType,
  type LatexBlockImport,
  type LatexDocumentInfo,
  type LatexEnvironmentBlock,
  type LatexImportContext,
  type LatexMacro,
  type LatexTextMatchTransformer,
  type LatexTransformer,
  hasChapters,
} from './LatexTransformers';
import {
  findClosingBrace,
  readBraceArgument,
  readBraceArguments,
  readOptionalArgument,
  splitDocument,
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
  /^\\(tableofcontents|listoffigures|listoftables|newpage|clearpage|pagebreak|bigskip|medskip|smallskip|centering|raggedright|raggedleft|noindent|vfill|hfill|appendix|frontmatter|mainmatter|backmatter|twocolumn|onecolumn|sloppy|linenumbers|columnbreak|newcolumn|small|footnotesize|scriptsize|tiny|normalsize|large|Large|LARGE|huge|Huge|vspace\*?\{[^}]*\}|label\{[^}]*\}|setlength\{[^}]*\}\{[^}]*\}|setcounter\{[^}]*\}\{[^}]*\}|bibliographystyle\{[^}]*\}|bibliography\{[^}]*\}|pagestyle\{[^}]*\}|thispagestyle\{[^}]*\}|selectlanguage\{[^}]*\}|pagenumbering\{[^}]*\})$/;

/** Environments whose body is code: read verbatim, never as LaTeX. */
const VERBATIM_ENVIRONMENTS = new Set([
  'verbatim',
  'Verbatim',
  'lstlisting',
  'minted',
  'alltt',
  'pythoncode',
  'code',
  'algorithm',
  'algorithmic',
  'algorithm2e',
  'tikzpicture',
  'circuitikz',
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
  multicols: 1,
  column: 1,
  frame: 1,
  block: 1,
  alertblock: 1,
  exampleblock: 1,
  letter: 1,
  thebibliography: 1,
};

/**
 * Commands whose text is their last argument: `\textcolor{red}{text}` keeps
 * `text`, not `red`.
 */
const LAST_ARGUMENT_COMMANDS: Record<string, number> = {
  textcolor: 2,
  colorbox: 2,
  parbox: 2,
  raisebox: 2,
  scalebox: 2,
  rotatebox: 2,
  fcolorbox: 3,
  resizebox: 3,
};

/** The date `\today` stands for, the way a paper prints it. */
export function todayForLatex(now: Date = new Date()): string {
  return now.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** An empty document description, before the preamble is read. */
export function emptyDocumentInfo(): LatexDocumentInfo {
  return {
    address: null,
    author: null,
    classOptions: [],
    date: null,
    documentClass: null,
    email: null,
    homepage: null,
    institute: null,
    macros: [],
    name: null,
    phone: null,
    signature: null,
    subtitle: null,
    title: null,
  };
}

/** The first `{…}` argument of the first `\command` in `text`, if any. */
function commandArgument(text: string, command: string): string | null {
  const regExp = new RegExp(`\\\\${command}(?![A-Za-z])`);
  const match = regExp.exec(text);
  if (!match) {
    return null;
  }
  let i = match.index + match[0].length;
  const optional = readOptionalArgument(text, i);
  if (optional) {
    i = optional.end;
  }
  return readBraceArgument(text, i)?.value ?? null;
}

/** Up to `count` arguments of the first `\command` in `text`. */
function commandArguments(
  text: string,
  command: string,
  count: number,
): string[] {
  const regExp = new RegExp(`\\\\${command}(?![A-Za-z])`);
  const match = regExp.exec(text);
  if (!match) {
    return [];
  }
  return readBraceArguments(text, match.index + match[0].length, count).values;
}

/** The macros a preamble defines with `\newcommand` and its relatives. */
export function parseMacros(preamble: string): LatexMacro[] {
  const macros: LatexMacro[] = [];
  const definition =
    /\\(?:re)?newcommand\*?|\\providecommand\*?|\\DeclareRobustCommand\*?|\\def(?=\\)/g;
  let match: RegExpExecArray | null;
  while ((match = definition.exec(preamble)) !== null) {
    let i = match.index + match[0].length;
    let name: string | null = null;
    // `\newcommand{\foo}` or `\newcommand\foo`
    const braced = readBraceArgument(preamble, i);
    if (braced && /^\\[A-Za-z]+$/.test(braced.value.trim())) {
      name = braced.value.trim().slice(1);
      i = braced.end;
    } else {
      const bare = /^\s*\\([A-Za-z]+)/.exec(preamble.slice(i));
      if (bare) {
        name = bare[1];
        i += bare[0].length;
      }
    }
    if (!name) {
      continue;
    }
    let arity = 0;
    let defaultArg: string | null = null;
    const count = readOptionalArgument(preamble, i);
    if (count && /^\d+$/.test(count.value.trim())) {
      arity = Number(count.value.trim());
      i = count.end;
      const fallback = readOptionalArgument(preamble, i);
      if (fallback) {
        defaultArg = fallback.value;
        i = fallback.end;
      }
    }
    const body = readBraceArgument(preamble, i);
    if (!body) {
      continue;
    }
    macros.push({ arity, body: body.value, defaultArg, name });
    definition.lastIndex = body.end;
  }
  return macros;
}

/** `text` with the source's own macros written out. */
export function expandMacros(text: string, macros: LatexMacro[]): string {
  if (macros.length === 0) {
    return text;
  }
  // Longer names first, so `\foobar` is not read as `\foo` + `bar`.
  const sorted = [...macros].sort((a, b) => b.name.length - a.name.length);
  let current = text;
  for (let pass = 0; pass < 10; pass++) {
    let changed = false;
    for (const macro of sorted) {
      const regExp = new RegExp(`\\\\${macro.name}(?![A-Za-z])`, 'g');
      let out = '';
      let last = 0;
      let match: RegExpExecArray | null;
      while ((match = regExp.exec(current)) !== null) {
        let i = match.index + match[0].length;
        const args: string[] = [];
        if (macro.defaultArg !== null) {
          const optional = readOptionalArgument(current, i);
          args.push(optional ? optional.value : macro.defaultArg);
          if (optional) {
            i = optional.end;
          }
        }
        const remaining = macro.arity - args.length;
        const braced = readBraceArguments(current, i, remaining);
        args.push(...braced.values);
        i = braced.end;
        let expansion = macro.body;
        args.forEach((value, index) => {
          expansion = expansion.split(`#${index + 1}`).join(value);
        });
        // `\foo bar` swallows the space after a word-like command; keep it.
        const glue = /^\s/.test(current.slice(i)) ? '' : '';
        out += current.slice(last, match.index) + expansion + glue;
        last = i;
        regExp.lastIndex = i;
        changed = true;
      }
      current = out + current.slice(last);
    }
    if (!changed) {
      break;
    }
  }
  return current;
}

/** What the preamble says about the document. */
export function parsePreamble(preamble: string): LatexDocumentInfo {
  const info = emptyDocumentInfo();
  const documentClass = /\\documentclass(?:\[([^\]]*)\])?\{([^}]*)\}/.exec(
    preamble,
  );
  if (documentClass) {
    info.documentClass = documentClass[2].trim();
    info.classOptions = (documentClass[1] ?? '')
      .split(',')
      .map(option => option.trim())
      .filter(Boolean);
  }
  const text = stripComments(preamble);
  info.title = commandArgument(text, 'title');
  info.subtitle = commandArgument(text, 'subtitle');
  info.author = commandArgument(text, 'author');
  info.date = commandArgument(text, 'date');
  info.institute = commandArgument(text, 'institute');
  info.signature = commandArgument(text, 'signature');
  info.email = commandArgument(text, 'email');
  info.homepage = commandArgument(text, 'homepage');
  info.phone = commandArgument(text, 'phone');
  const address = commandArguments(text, 'address', 3);
  info.address = address.length > 0 ? address.join(', ') : null;
  const name = commandArguments(text, 'name', 2);
  info.name = name.length > 0 ? name.join(' ').trim() : null;
  info.macros = parseMacros(text);
  return info;
}

export interface LatexImportResult {
  /** The document's blocks, in order. */
  nodes: LexicalNode[];
  /** What the preamble said about the document. */
  document: LatexDocumentInfo;
}

type EnvironmentImport = Extract<LatexBlockImport, { kind: 'environment' }>;
type LineImport = Extract<LatexBlockImport, { kind: 'line' }>;

/**
 * A function that, called inside an editor update, reads a LaTeX source into
 * nodes (created, not yet attached) and the document's description.
 */
export function createLatexImporter(
  transformers: LatexTransformer[] = LATEX_TRANSFORMERS,
): (latex: string) => LatexImportResult {
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

  return (latex: string): LatexImportResult => {
    const { preamble, body } = splitDocument(latex);
    const document = parsePreamble(preamble);
    const columnWeights = new WeakMap<LexicalNode, number>();

    // ── Blocks ──────────────────────────────────────────────────────────

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
          const equation =
            end === -1 ? text.slice(start) : text.slice(start, end);
          const paragraph = $createParagraphNode();
          paragraph.append($math(equation.trim(), true));
          nodes.push(paragraph);
          cursor = end === -1 ? text.length : end + close.length;
        }
      }
      return normalizeBlocks(nodes);
    };

    /**
     * What several transformers produce piecemeal, put together: adjacent
     * columns into one layout, adjacent lists of a kind into one list.
     */
    const normalizeBlocks = (nodes: LexicalNode[]): LexicalNode[] => {
      const out: LexicalNode[] = [];
      let index = 0;
      while (index < nodes.length) {
        const node = nodes[index];
        if ($isLayoutItemNode(node)) {
          const items = [node];
          while (
            index + 1 < nodes.length &&
            $isLayoutItemNode(nodes[index + 1])
          ) {
            items.push(nodes[++index] as typeof node);
          }
          if (items.length === 1) {
            // A lone box is not a column: its content stands on its own.
            out.push(...node.getChildren());
          } else {
            out.push(
              $columnsOf(
                items,
                items.map(item => columnWeights.get(item) ?? 1),
              ),
            );
          }
        } else if (
          $isListNode(node) &&
          out.length > 0 &&
          $isListNode(out[out.length - 1]) &&
          (out[out.length - 1] as typeof node).getListType() ===
            node.getListType()
        ) {
          (out[out.length - 1] as typeof node).append(...node.getChildren());
        } else {
          out.push(node);
        }
        index++;
      }
      return out;
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
      // `\par` is a paragraph break, like a blank line.
      const source = stripComments(chunk).replace(/\\par(?![A-Za-z])/g, '\n\n');
      for (const line of source.split('\n')) {
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

    // ── Inline ──────────────────────────────────────────────────────────

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
      const skipSpaces = (from: number) => {
        let i = from;
        while (text[i] === ' ') {
          i++;
        }
        return i;
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
            i = skipSpaces(i);
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
            const args = readBraceArguments(text, j, 2);
            j = args.end;
            const node = handler.replace(args.values, options, ctx);
            pushAll(node ? [node] : []);
            i = j;
            continue;
          }

          const lastArgument = LAST_ARGUMENT_COMMANDS[name];
          if (lastArgument) {
            const optional = readOptionalArgument(text, j);
            if (optional) {
              j = optional.end;
            }
            const args = readBraceArguments(text, j, lastArgument);
            const content = args.values[args.values.length - 1];
            if (content !== undefined) {
              pushAll(parseInline(content, format));
            }
            i = args.end;
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
              j = skipSpaces(j);
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
            case 'today':
              buffer += todayForLatex();
              j = skipEmptyGroup(text, j);
              break;
            case 'and':
              // `A \and B`: the space before it belongs to the command.
              buffer = buffer.replace(/\s+$/, '') + ', ';
              break;
            case 'quad':
            case 'qquad':
            case 'enspace':
            case 'hfill':
            case 'vfill':
            case 'dotfill':
            case 'hrulefill':
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
            case 'cite':
            case 'citep':
            case 'citet':
            case 'textcite':
            case 'parencite':
            case 'autocite': {
              const optional = readOptionalArgument(text, j);
              if (optional) {
                j = optional.end;
              }
              const argument = readBraceArgument(text, j);
              if (argument) {
                buffer += `[${argument.value
                  .split(',')
                  .map(key => key.trim())
                  .join(', ')}]`;
                j = argument.end;
              }
              break;
            }
            case 'label':
            case 'ref':
            case 'eqref':
            case 'pageref':
            case 'index':
            case 'thanks':
            case 'hspace':
            case 'vspace':
            case 'hyphenation':
            case 'phantom': {
              // References, spacing and notes have no text here; their
              // argument goes too.
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
          buffer += ' ';
          i++;
          continue;
        }
        // TeX's dashes and quotes.
        if (text.startsWith('---', i)) {
          buffer += '—';
          i += 3;
          continue;
        }
        if (text.startsWith('--', i)) {
          buffer += '–';
          i += 2;
          continue;
        }
        if (text.startsWith('``', i)) {
          buffer += '“';
          i += 2;
          continue;
        }
        if (text.startsWith("''", i)) {
          buffer += '”';
          i += 2;
          continue;
        }
        if (ch === '`') {
          buffer += '‘';
          i++;
          continue;
        }
        buffer += ch;
        i++;
      }
      flush();
      return nodes;
    };

    const ctx: LatexImportContext = {
      columnWeights,
      document,
      importBlocks,
      importInline,
      chapters: hasChapters(document.documentClass, body),
    };

    let nodes = importBlocks(expandMacros(body, document.macros));

    // A letter opens with the sender's address; the class prints it itself.
    if (document.documentClass === 'letter' && document.address) {
      const address = $createParagraphNode();
      address.append(
        ...importInline(document.address.split(', ').join('\\\\ ')),
      );
      nodes = [address, ...nodes];
    }

    // A two-column class sets the body — after the title and the abstract —
    // in two columns.
    if (document.classOptions.includes('twocolumn')) {
      let split = $isHeadingNode(nodes[0]) ? 1 : 0;
      while (
        split < nodes.length &&
        ($isParagraphNode(nodes[split]) || $isQuoteNode(nodes[split]))
      ) {
        split++;
      }
      const rest = nodes.slice(split);
      if (rest.length >= 2) {
        nodes = [
          ...nodes.slice(0, split),
          $columnsOf($splitBlocks(rest, 2).map($columnOf), [1, 1]),
        ];
      }
    }

    return { document, nodes };
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
 * A function that, called inside an editor update, appends the nodes read
 * from a LaTeX source to the root. Clear the root first to replace.
 */
export function createLatexImport(
  transformers: LatexTransformer[] = LATEX_TRANSFORMERS,
): (latex: string) => void {
  const importer = createLatexImporter(transformers);
  return (latex: string) => {
    $getRoot().append(...importer(latex).nodes);
  };
}

/**
 * Read `latex` into nodes and the document's description, without attaching
 * anything. Call inside `editor.update()`.
 */
export function $importLatex(
  latex: string,
  transformers: LatexTransformer[] = LATEX_TRANSFORMERS,
): LatexImportResult {
  return createLatexImporter(transformers)(latex);
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
