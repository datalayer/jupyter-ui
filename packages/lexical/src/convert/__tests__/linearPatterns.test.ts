/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The converters read text they did not write: a pasted preamble, a PDF, an
 * SVG, an error message. Their patterns were rewritten to scan in linear
 * time (CodeQL's polynomial-ReDoS findings on jupyter-ui#501); these pin that
 * ordinary input still reads the same, and that the input shapes CodeQL named
 * finish at once rather than after quadratic backtracking.
 */

import { describe, expect, it, jest } from '@jest/globals';

// The LaTeX importer's Jupyter nodes reach the notebook stack only when they
// render, as in latex.test.ts.
jest.mock('@datalayer/jupyter-react', () => ({ __esModule: true }));

import { parsePreamble } from '../latex/LatexImport';
import { countPdfPages } from '../pdf/PdfWriter';
import { pdfFilename } from '../pdf/raster';
import { svgForTypst } from '../typst/LexicalToTypst';
import { explainLoomFailure } from '../../utils/loom';

const LONG = 50_000;

/** Runs `run` and fails if it takes more than a generous `budgetMs`. */
function quickly(run: () => unknown, budgetMs = 500): void {
  const start = performance.now();
  run();
  expect(performance.now() - start).toBeLessThan(budgetMs);
}

const bytes = (text: string) =>
  Uint8Array.from(text, character => character.charCodeAt(0));

describe('parsePreamble', () => {
  it('reads the class and its options', () => {
    const info = parsePreamble('\\documentclass[11pt,a4paper]{article}\n');
    expect(JSON.stringify(info)).toContain('article');
  });

  it('is linear on repeated openers', () => {
    quickly(() => parsePreamble('\\documentclass['.repeat(LONG)));
    quickly(() => parsePreamble('\\documentclass{'.repeat(LONG)));
    quickly(() => parsePreamble('\\documentclass[\\'.repeat(LONG)));
  });
});

describe('countPdfPages', () => {
  it('reads the page tree count', () => {
    expect(
      countPdfPages(
        bytes('1 0 obj << /Type /Pages /Kids [3 0 R] /Count 7 >> endobj'),
      ),
    ).toBe(7);
  });

  it('falls back to counting pages', () => {
    expect(
      countPdfPages(
        bytes('<< /Type /Page >> << /Type /Page >> << /Type /Page >>'),
      ),
    ).toBe(3);
  });

  it('is linear on repeated page-tree openers', () => {
    quickly(() => countPdfPages(bytes('/Type/Pages'.repeat(LONG))));
  });
});

describe('pdfFilename', () => {
  it('slugs a title', () => {
    expect(pdfFilename('  Hello, World!  ')).toBe('hello-world.pdf');
    expect(pdfFilename('---')).toBe('document.pdf');
    expect(pdfFilename(undefined, 'notes')).toBe('notes.pdf');
  });

  it('is linear on long runs', () => {
    quickly(() => pdfFilename('-'.repeat(LONG) + 'a'));
  });
});

describe('svgForTypst', () => {
  it('drops font faces and keeps the rest', () => {
    expect(
      svgForTypst(
        '<style>@font-face { font-family: X; src: url(a) } .a{}</style>',
      ),
    ).toBe('<style> .a{}</style>');
  });

  it('is linear on repeated font-face openers', () => {
    quickly(() => svgForTypst('@font-face{'.repeat(LONG)));
  });
});

describe('explainLoomFailure', () => {
  it('recognises the React 19 render failure', () => {
    expect(
      explainLoomFailure(new TypeError('ReactDOM.render is not a function')),
    ).toContain('React 18');
    expect(
      explainLoomFailure(new Error('x is not a function (in render)')),
    ).toContain('React 18');
  });

  it('passes other errors through', () => {
    expect(explainLoomFailure(new Error('network down'))).not.toContain(
      'React 18',
    );
  });

  it('is linear on repeated phrases', () => {
    quickly(() =>
      explainLoomFailure(new Error('is not a function'.repeat(LONG))),
    );
  });
});
