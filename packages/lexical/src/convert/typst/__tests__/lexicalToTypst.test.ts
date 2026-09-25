/**
 * @jest-environment jsdom
 */
/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The Typst markup: headings, formats and links as functions, lists, raw
 * blocks, tables with headers and spans, grids for columns, mitex for math
 * — and text that means what it says once escaped.
 */

import { describe, expect, it, jest } from '@jest/globals';

jest.mock('@datalayer/jupyter-react', () => ({ __esModule: true }));

import { findLatexTemplate } from '../../latex';
import {
  editorWithLatex,
  editorWithMarkdown,
} from '../../pdf/__tests__/support';
import { escapeTypst, lexicalToTypst, svgForTypst } from '../LexicalToTypst';
import {
  DEFAULT_TYPST_MODULE_URL,
  DEFAULT_TYPST_WASM_URL,
  isTypstEngine,
} from '../TypstEngine';

describe('Typst markup', () => {
  it('escapes what Typst would read as markup', () => {
    expect(escapeTypst('a*b _c_ #d $e$ <f> @g [h] `i` ~ // x /* y')).toBe(
      'a\\*b \\_c\\_ \\#d \\$e\\$ \\<f\\> \\@g \\[h\\] \\`i\\` \\~ \\// x \\/\\* y',
    );
    expect(escapeTypst('- not a list\n= not a heading\n+ nor\n. dot')).toBe(
      '\\- not a list\n\\= not a heading\n\\+ nor\n\\. dot',
    );
  });

  it('writes a markdown document as Typst', async () => {
    const editor = editorWithMarkdown(`# Title

Some **bold**, *italic*, \`code\`, ~~gone~~ and a [link](https://datalayer.io) with $x^2$.

- one
- two
    - nested

1. first
2. second

- [x] done
- [ ] todo

\`\`\`python
print("hi")
\`\`\`

| Name | Value |
| --- | --- |
| a | 1 |

> A quote

$$E = mc^2$$
`);
    const { main, files } = await lexicalToTypst(editor, {
      paper: 'us-letter',
    });
    expect(files.size).toBe(0);
    expect(main).toContain('#set page(paper: "us-letter"');
    expect(main).toContain('#import "@preview/mitex:0.2.5": mi, mitex');
    expect(main).toContain('#set document(title: "Title")');
    expect(main).toContain('\n= Title\n');
    expect(main).toContain('#strong[bold]');
    expect(main).toContain('#emph[italic]');
    expect(main).toContain('#raw("code")');
    expect(main).toContain('#strike[gone]');
    expect(main).toContain('#link("https://datalayer.io")[link]');
    expect(main).toContain('#mi(`x^2`)');
    expect(main).toContain('\n- one\n- two\n  - nested');
    expect(main).toContain('\n1. first\n2. second');
    expect(main).toContain(
      '- #box(width: 0.75em, height: 0.75em, stroke: 0.5pt, fill: luma(80)) done',
    );
    expect(main).toContain(
      '- #box(width: 0.75em, height: 0.75em, stroke: 0.5pt) todo',
    );
    expect(main).toContain('```python\nprint("hi")\n```');
    expect(main).toContain(
      '#table(columns: 2, stroke: 0.5pt + luma(200), inset: 6pt, table.header([#strong[Name]], [#strong[Value]]), [a], [1])',
    );
    expect(main).toContain('#quote(block: true)[\nA quote\n]');
    expect(main).toContain('#mitex(`E = mc^2`)');
  });

  it('writes columns as a grid, spans as table cells, boxes as blocks', async () => {
    const poster = await lexicalToTypst(
      editorWithLatex(findLatexTemplate('poster')!.source),
      { mitex: false },
    );
    expect(poster.main).toMatch(
      /#grid\(columns: \(33\.3fr, 33\.3fr, 33\.3fr\), gutter: 1\.2em, \[/,
    );
    expect(poster.main).toContain(
      '#block(width: 100%, inset: 10pt, radius: 4pt, stroke: 0.5pt + luma(200))[\n#strong[Introduction]',
    );
    expect(poster.main).not.toContain('mitex');
    expect(poster.main).toContain('```latex\n');
    const ieee = await lexicalToTypst(
      editorWithLatex(findLatexTemplate('journal-article')!.source),
    );
    expect(ieee.main).toContain(
      'table.cell(colspan: 3)[#emph[Lower is better.]]',
    );
    expect(ieee.main).toContain('#grid(columns: (50fr, 50fr)');
  });

  it('puts a title block above the document when asked', async () => {
    const editor = editorWithMarkdown('# Heading\n\nText.');
    const { main } = await lexicalToTypst(editor, {
      title: 'My Title',
      author: 'Ada & Bob',
      date: '2026',
    });
    expect(main).toContain(
      '#set document(title: "My Title", author: "Ada & Bob")',
    );
    expect(main).toContain(
      '#align(center)[#text(size: 2em, weight: "bold")[My Title]]',
    );
    expect(main).toContain('#align(center)[#emph[Ada & Bob]]');
  });

  it('strips the font faces Typst would try to open', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><style>@font-face { font-family: "Virgil"; src: url(data:font/woff2;base64,AAAA); } .a { fill: red }</style><text>x</text></svg>';
    expect(svgForTypst(svg)).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><style> .a { fill: red }</style><text>x</text></svg>',
    );
  });

  it('names the CDN copy of the engine and recognises an engine', () => {
    expect(DEFAULT_TYPST_MODULE_URL).toMatch(
      /^https:\/\/cdn\.jsdelivr\.net\/npm\/@myriaddreamin\/typst\.ts@[\d.]+\/.*\/\+esm$/,
    );
    expect(DEFAULT_TYPST_WASM_URL).toMatch(/typst_ts_web_compiler_bg\.wasm$/);
    expect(isTypstEngine({ compile: async () => new Uint8Array() })).toBe(true);
    expect(isTypstEngine({})).toBe(false);
  });
});
