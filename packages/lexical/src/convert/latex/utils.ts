/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Small pieces of LaTeX syntax handling shared by the export and the import.
 *
 * @module convert/latex/utils
 */

const ESCAPES: Record<string, string> = {
  '\\': '\\textbackslash{}',
  '{': '\\{',
  '}': '\\}',
  $: '\\$',
  '&': '\\&',
  '#': '\\#',
  '^': '\\^{}',
  _: '\\_',
  '%': '\\%',
  '~': '\\~{}',
};

/** Escape the characters LaTeX gives a meaning to in running text. */
export function escapeLatex(text: string): string {
  return text.replace(/[\\{}$&#^_%~]/g, ch => ESCAPES[ch] ?? ch);
}

/**
 * Index of the brace that closes the group opened at `openIndex`, honouring
 * nested groups and escaped braces; -1 when the group never closes.
 */
export function findClosingBrace(
  text: string,
  openIndex: number,
  open = '{',
  close = '}',
): number {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i];
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === open) {
      depth++;
    } else if (ch === close) {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
}

export interface LatexArgument {
  /** The text between the delimiters. */
  value: string;
  /** Index just past the closing delimiter. */
  end: number;
}

/**
 * Read a `{…}` argument starting at `index` (spaces before it are skipped).
 * `null` when there is no such argument there.
 */
export function readBraceArgument(
  text: string,
  index: number,
): LatexArgument | null {
  let i = index;
  while (i < text.length && (text[i] === ' ' || text[i] === '\n')) {
    i++;
  }
  if (text[i] !== '{') {
    return null;
  }
  const close = findClosingBrace(text, i);
  if (close === -1) {
    return null;
  }
  return { value: text.slice(i + 1, close), end: close + 1 };
}

/** Read a `[…]` optional argument starting at `index`, if there is one. */
export function readOptionalArgument(
  text: string,
  index: number,
): LatexArgument | null {
  let i = index;
  while (i < text.length && text[i] === ' ') {
    i++;
  }
  if (text[i] !== '[') {
    return null;
  }
  const close = findClosingBrace(text, i, '[', ']');
  if (close === -1) {
    return null;
  }
  return { value: text.slice(i + 1, close), end: close + 1 };
}

/** Drop `%` comments (an escaped `\%` is not a comment). */
export function stripComments(latex: string): string {
  return latex
    .split('\n')
    .map(line => {
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '\\') {
          i++;
          continue;
        }
        if (line[i] === '%') {
          return line.slice(0, i);
        }
      }
      return line;
    })
    .join('\n');
}

/**
 * The part of a LaTeX source worth importing: the body of the `document`
 * environment when there is one, the whole text otherwise.
 */
export function extractDocumentBody(latex: string): string {
  const begin = latex.indexOf('\\begin{document}');
  if (begin === -1) {
    return latex;
  }
  const start = begin + '\\begin{document}'.length;
  const end = latex.lastIndexOf('\\end{document}');
  return end === -1 ? latex.slice(start) : latex.slice(start, end);
}

/** The value of `key=value` in a comma-separated option list, if present. */
export function readOption(options: string | null, key: string): string | null {
  if (!options) {
    return null;
  }
  const match = new RegExp(`(?:^|,)\\s*${key}\\s*=\\s*([^,]+)`).exec(options);
  return match ? match[1].trim() : null;
}
