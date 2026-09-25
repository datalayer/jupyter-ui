/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The standard 14 fonts every PDF reader carries, so nothing is embedded:
 * their names, their widths for measuring lines, and the WinAnsi encoding
 * their text is written in.
 *
 * @module convert/pdf/fonts
 */

export type PdfFontName =
  | 'Helvetica'
  | 'Helvetica-Bold'
  | 'Helvetica-Oblique'
  | 'Helvetica-BoldOblique'
  | 'Courier'
  | 'Courier-Bold';

export const PDF_FONTS: PdfFontName[] = [
  'Helvetica',
  'Helvetica-Bold',
  'Helvetica-Oblique',
  'Helvetica-BoldOblique',
  'Courier',
  'Courier-Bold',
];

/** Glyph widths of Helvetica for characters 32–126, in 1/1000 em. */
// prettier-ignore
const HELVETICA = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];

/** Glyph widths of Helvetica-Bold for characters 32–126. */
// prettier-ignore
const HELVETICA_BOLD = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
  975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
  333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
  611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
];

/** Widths of the WinAnsi characters above 126 that differ from a letter. */
const SPECIAL_WIDTHS: Record<string, [number, number]> = {
  '—': [1000, 1000], // em dash
  '–': [556, 556], // en dash
  '•': [350, 350], // bullet
  '‘': [222, 278],
  '’': [222, 278],
  '“': [333, 500],
  '”': [333, 500],
  '…': [1000, 1000],
  '€': [556, 556],
  '·': [278, 278],
  '×': [584, 584],
  '°': [400, 400],
  '±': [584, 584],
  ' ': [278, 278],
  '©': [737, 737],
  '®': [737, 737],
  '™': [1000, 1000],
  '«': [556, 556],
  '»': [556, 556],
  '§': [556, 556],
  '¶': [537, 556],
};

/** Characters outside WinAnsi that have a close enough stand-in. */
const REPLACEMENTS: Record<string, string> = {
  '−': '-', // minus
  '→': '->',
  '←': '<-',
  '⇒': '=>',
  '≤': '<=',
  '≥': '>=',
  '≠': '!=',
  '≈': '~',
  '∎': '#', // end of proof
  '■': '#',
  '□': '[ ]',
  '☐': '[ ]',
  '☑': '[x]',
  '☒': '[x]',
  '✓': 'v',
  '✔': 'v',
  '▸': '>',
  '▾': 'v',
  ' ': ' ',
  ' ': ' ',
  ' ': ' ',
  '​': '',
  '﻿': '',
  '­': '',
};

/** WinAnsi code points 0x80–0x9F, by character. */
const WINANSI_HIGH: Record<string, number> = {
  '€': 0x80,
  '‚': 0x82,
  ƒ: 0x83,
  '„': 0x84,
  '…': 0x85,
  '†': 0x86,
  '‡': 0x87,
  ˆ: 0x88,
  '‰': 0x89,
  Š: 0x8a,
  '‹': 0x8b,
  Œ: 0x8c,
  Ž: 0x8e,
  '‘': 0x91,
  '’': 0x92,
  '“': 0x93,
  '”': 0x94,
  '•': 0x95,
  '–': 0x96,
  '—': 0x97,
  '˜': 0x98,
  '™': 0x99,
  š: 0x9a,
  '›': 0x9b,
  œ: 0x9c,
  ž: 0x9e,
  Ÿ: 0x9f,
};

/**
 * `text` as WinAnsi bytes. Characters the encoding lacks are replaced by a
 * stand-in or a question mark; the text actually written is returned too,
 * for measuring.
 */
export function encodeWinAnsi(text: string): { bytes: number[]; text: string } {
  const bytes: number[] = [];
  let written = '';
  for (const char of text) {
    const replacement = REPLACEMENTS[char];
    const chars = replacement !== undefined ? replacement : char;
    for (const c of chars) {
      const code = c.codePointAt(0) ?? 63;
      if (code < 0x80 || (code >= 0xa0 && code <= 0xff)) {
        bytes.push(code);
        written += c;
      } else if (WINANSI_HIGH[c] !== undefined) {
        bytes.push(WINANSI_HIGH[c]);
        written += c;
      } else {
        // A letter with a diacritic WinAnsi lacks: its base letter.
        const base = c.normalize('NFD').replace(/[̀-ͯ]/g, '');
        const baseCode = base.codePointAt(0) ?? 63;
        if (base.length === 1 && baseCode < 0x80) {
          bytes.push(baseCode);
          written += base;
        } else {
          bytes.push(63);
          written += '?';
        }
      }
    }
  }
  return { bytes, text: written };
}

function isBold(font: PdfFontName): boolean {
  return font === 'Helvetica-Bold' || font === 'Helvetica-BoldOblique';
}

/** The width of one character, in 1/1000 em. */
export function charWidth(char: string, font: PdfFontName): number {
  if (font === 'Courier' || font === 'Courier-Bold') {
    return 600;
  }
  const bold = isBold(font);
  const code = char.codePointAt(0) ?? 32;
  if (code >= 32 && code <= 126) {
    return (bold ? HELVETICA_BOLD : HELVETICA)[code - 32];
  }
  const special = SPECIAL_WIDTHS[char];
  if (special) {
    return special[bold ? 1 : 0];
  }
  const base = char.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const baseCode = base.codePointAt(0) ?? 32;
  if (base.length === 1 && baseCode >= 32 && baseCode <= 126) {
    return (bold ? HELVETICA_BOLD : HELVETICA)[baseCode - 32];
  }
  return bold ? 611 : 556;
}

/** The width of `text` set in `font` at `size` points. */
export function textWidth(
  text: string,
  font: PdfFontName,
  size: number,
): number {
  let total = 0;
  for (const char of text) {
    total += charWidth(char, font);
  }
  return (total * size) / 1000;
}

/** The font for a run: bold and italic pick the Helvetica face, code Courier. */
export function fontFor(style: {
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}): PdfFontName {
  if (style.code) {
    return style.bold ? 'Courier-Bold' : 'Courier';
  }
  if (style.bold && style.italic) {
    return 'Helvetica-BoldOblique';
  }
  if (style.bold) {
    return 'Helvetica-Bold';
  }
  if (style.italic) {
    return 'Helvetica-Oblique';
  }
  return 'Helvetica';
}
