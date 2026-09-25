/**
 * @jest-environment jsdom
 */
/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The document model, and the PDF laid out from it: the blocks come out in
 * order with their kinds, and the layout pages them, keeps the text as text
 * and the links as links. Pictures are off here (no canvas under jsdom), so
 * equations and images show as placeholders.
 */

import { describe, expect, it, jest } from '@jest/globals';

jest.mock('@datalayer/jupyter-react', () => ({ __esModule: true }));

import { $createTextNode, $getRoot, $isElementNode } from 'lexical';
import { findLatexTemplate } from '../../latex';
import { editorWithLatex, editorWithMarkdown } from './support';
import { readDocument, type Block } from '../documentModel';
import { documentToPdf, exportLexicalToPdf } from '../LexicalToPdf';
import { countPdfPages } from '../PdfWriter';
import { encodeWinAnsi } from '../fonts';

const latin1 = (bytes: Uint8Array) =>
  Array.from(bytes, byte => String.fromCharCode(byte)).join('');

/** Whether `text` was written in the PDF (as one hex string). */
const hasText = (pdf: string, text: string) =>
  pdf.includes(
    `<${encodeWinAnsi(text)
      .bytes.map(b => b.toString(16).padStart(2, '0'))
      .join('')}>`,
  );

const MARKDOWN = `# Title

Some **bold**, *italic*, \`code\` and a [link](https://datalayer.io) with $x^2$ inline.

> A quote

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
| b | 2 |

---

$$E = mc^2$$

![alt text](https://example.org/missing.png)
`;

describe('the document model', () => {
  it('reads every block kind in order', () => {
    const editor = editorWithMarkdown(MARKDOWN);
    const document = readDocument(editor);
    expect(document.title).toBe('Title');
    expect(document.blocks.map(block => block.kind)).toEqual([
      'heading',
      'paragraph',
      'quote',
      'list',
      'list',
      'list',
      'code',
      'table',
      'rule',
      'equation',
      'image',
    ]);
    const paragraph = document.blocks[1] as Extract<
      Block,
      { kind: 'paragraph' }
    >;
    const kinds = paragraph.inlines.map(run =>
      run.kind === 'text'
        ? [run.bold, run.italic, run.code, run.link].filter(Boolean).length
        : run.kind,
    );
    expect(kinds).toContain('equation');
    expect(
      paragraph.inlines.some(
        run => run.kind === 'text' && run.link === 'https://datalayer.io',
      ),
    ).toBe(true);
    const bullets = document.blocks[3] as Extract<Block, { kind: 'list' }>;
    expect(bullets.ordered).toBe(false);
    expect(bullets.items.length).toBe(2);
    expect(bullets.items[1].blocks.map(b => b.kind)).toEqual([
      'paragraph',
      'list',
    ]);
    const checks = document.blocks[5] as Extract<Block, { kind: 'list' }>;
    expect(checks.items.map(item => item.checked)).toEqual([true, false]);
    const table = document.blocks[7] as Extract<Block, { kind: 'table' }>;
    expect(table.rows.length).toBe(3);
    expect(table.rows[0].every(cell => cell.header)).toBe(true);
    const code = document.blocks[6] as Extract<Block, { kind: 'code' }>;
    expect(code.executable).toBe(true);
    expect(code.language).toBe('python');
  });

  it('reads columns, spanning cells and collapsibles from LaTeX', () => {
    const editor = editorWithLatex(findLatexTemplate('poster')!.source);
    const document = readDocument(editor);
    const columns = document.blocks.find(b => b.kind === 'columns') as Extract<
      Block,
      { kind: 'columns' }
    >;
    expect(columns.columns.length).toBe(3);
    expect(columns.weights.length).toBe(3);
    const boxes = columns.columns.flat().filter(b => b.kind === 'collapsible');
    expect(boxes.length).toBe(4);
    const ieee = readDocument(
      editorWithLatex(findLatexTemplate('journal-article')!.source),
    );
    const table = JSON.stringify(ieee.blocks).includes('"colSpan":3');
    expect(table).toBe(true);
  });
});

describe('a paragraph holding a table', () => {
  it('is split into its text and the table', () => {
    const editor = editorWithMarkdown(
      'Before\n\n| A | B |\n| --- | --- |\n| 1 | 2 |',
    );
    editor.update(
      () => {
        // Move the table into the paragraph before it, as pasted content does.
        const [paragraph, table] = $getRoot().getChildren();
        if ($isElementNode(paragraph) && table) {
          paragraph.append(table, $createTextNode(' after'));
        }
      },
      { discrete: true },
    );
    const document = readDocument(editor);
    expect(document.blocks.map(block => block.kind)).toEqual([
      'paragraph',
      'table',
      'paragraph',
    ]);
    const table = document.blocks[1] as Extract<Block, { kind: 'table' }>;
    expect(table.rows.length).toBe(2);
    expect(table.rows[0].every(cell => cell.header)).toBe(true);
    expect(document.blocks[2]).toMatchObject({ inlines: [{ text: ' after' }] });
  });
});

describe('the PDF laid out from the document', () => {
  it('pages a long document and keeps its text as text', async () => {
    const editor = editorWithLatex(findLatexTemplate('thesis')!.source);
    const bytes = await exportLexicalToPdf(editor, {
      pictures: false,
      author: 'Ada',
    });
    const pdf = latin1(bytes);
    expect(pdf.startsWith('%PDF-1.4')).toBe(true);
    expect(countPdfPages(bytes)).toBeGreaterThanOrEqual(2);
    expect(hasText(pdf, 'Introduction')).toBe(true);
    expect(hasText(pdf, 'Contributions')).toBe(true);
    // The title is the first heading; the footer numbers the pages.
    expect(pdf).toContain('/Title <feff');
    expect(hasText(pdf, `1 / ${countPdfPages(bytes)}`)).toBe(true);
  });

  it('writes links, code, tables, lists and placeholders for pictures', async () => {
    const editor = editorWithMarkdown(MARKDOWN);
    const bytes = await exportLexicalToPdf(editor, { pictures: false });
    const pdf = latin1(bytes);
    expect(countPdfPages(bytes)).toBe(1);
    expect(pdf).toContain('/URI <feff');
    expect(hasText(pdf, 'link')).toBe(true);
    expect(pdf).toContain('/F5 '); // Courier for the code block
    expect(hasText(pdf, 'print("hi")')).toBe(true);
    expect(hasText(pdf, 'Value')).toBe(true);
    expect(hasText(pdf, '1.')).toBe(true);
    expect(hasText(pdf, '•')).toBe(true);
    // No canvas here: the display equation is written as its TeX, the image as its alt text.
    expect(hasText(pdf, 'E = mc^2')).toBe(true);
    expect(hasText(pdf, 'alt text')).toBe(true);
    // Rectangles were drawn: table cells, code background, check boxes.
    expect((pdf.match(/ re\b/g) ?? []).length).toBeGreaterThan(8);
  });

  it('sets columns side by side and continues after the longest', () => {
    const editor = editorWithLatex(findLatexTemplate('newsletter')!.source);
    const document = readDocument(editor);
    const bytes = documentToPdf(document, new Map(), { pictures: false });
    const pdf = latin1(bytes);
    // Three columns: text starts at three distinct x positions on the page.
    const xs = new Set(
      Array.from(pdf.matchAll(/1 0 0 1 ([\d.]+) [\d.]+ Tm/g)).map(m =>
        Math.round(Number(m[1])),
      ),
    );
    expect(xs.size).toBeGreaterThanOrEqual(3);
    expect(hasText(pdf, 'New members')).toBe(true);
    // The narrow column wraps this heading: its last word is on a line of its own.
    expect(hasText(pdf, 'archive')).toBe(true);
    expect(hasText(pdf, 'Save the date')).toBe(true);
  });

  it('gives an empty document one empty page', () => {
    const editor = editorWithMarkdown('');
    const bytes = documentToPdf(readDocument(editor));
    expect(countPdfPages(bytes)).toBe(1);
  });
});
