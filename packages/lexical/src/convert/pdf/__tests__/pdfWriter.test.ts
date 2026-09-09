/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The writer makes files a reader can open: a header, objects at the
 * offsets the cross-reference table gives, the page tree, the text in the
 * fonts it names, images and links where they were put.
 */

import { describe, expect, it } from '@jest/globals';
import { countPdfPages, PAGE_SIZES, PdfWriter } from '../PdfWriter';
import { encodeWinAnsi, fontFor, textWidth } from '../fonts';

const latin1 = (bytes: Uint8Array) =>
  Array.from(bytes, byte => String.fromCharCode(byte)).join('');

describe('PdfWriter', () => {
  it('writes a well-formed file with pages, text, an image and a link', () => {
    const writer = new PdfWriter({
      size: PAGE_SIZES.a4,
      title: 'Título — test',
      author: 'Ada',
    });
    const first = writer.addPage();
    first.text(56, 80, 'Hello, world — “quoted”', 'Helvetica-Bold', 14);
    first.rect(56, 100, 200, 20, { fill: '#f6f8fa', stroke: '#d0d7de' });
    first.line(56, 130, 256, 130, '#000000', 0.5);
    first.link(56, 70, 100, 14, 'https://datalayer.io/?a=1&b=2');
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 0xff, 0xd9]);
    const image = writer.addJpeg(jpeg, 10, 5);
    const second = writer.addPage();
    second.image(image, 56, 56, 100, 50);
    second.text(56, 200, 'Page two', 'Courier', 10, [0.5, 0.5, 0.5]);

    const bytes = writer.build();
    const text = latin1(bytes);
    expect(text.startsWith('%PDF-1.4\n')).toBe(true);
    expect(text.endsWith('%%EOF\n')).toBe(true);
    expect(countPdfPages(bytes)).toBe(2);

    // Every cross-reference offset points at its object.
    const xrefAt = Number(/startxref\n(\d+)\n%%EOF/.exec(text)?.[1]);
    expect(text.slice(xrefAt, xrefAt + 4)).toBe('xref');
    const entries = text
      .slice(xrefAt)
      .split('\n')
      .filter(line => /^\d{10} 00000 n $/.test(line))
      .map(line => Number(line.slice(0, 10)));
    entries.forEach((offset, i) => {
      expect(text.slice(offset, offset + `${i + 1} 0 obj`.length)).toBe(
        `${i + 1} 0 obj`,
      );
    });

    // The text went out as WinAnsi hex in the font it named.
    const { bytes: hello } = encodeWinAnsi('Hello, world — “quoted”');
    const hex = hello.map(b => b.toString(16).padStart(2, '0')).join('');
    expect(text).toContain(`/F2 14 Tf`);
    expect(text).toContain(`<${hex}> Tj`);
    expect(hello[hello.indexOf(0x97)]).toBe(0x97); // em dash
    // The image object and its placement, the link with its URI.
    expect(text).toContain('/Subtype /Image /Width 10 /Height 5');
    expect(text).toContain('/Im1 Do');
    expect(text).toMatch(/\/Subtype \/Link \/Rect \[56 [\d.]+ 156 [\d.]+\]/);
    expect(text).toContain('/Type /Annot');
    // Unicode title as UTF-16BE with a byte-order mark.
    expect(text).toContain('/Title <feff');
  });

  it('measures text with the standard font widths', () => {
    expect(textWidth('Hello', 'Helvetica', 10)).toBeCloseTo(
      (722 + 556 + 222 + 222 + 556) / 100,
      3,
    );
    expect(textWidth('iiii', 'Courier', 10)).toBeCloseTo(24, 5);
    expect(textWidth('m', 'Helvetica-Bold', 10)).toBeGreaterThan(
      textWidth('m', 'Helvetica', 10),
    );
    expect(fontFor({ bold: true, italic: true })).toBe('Helvetica-BoldOblique');
    expect(fontFor({ code: true, bold: true })).toBe('Courier-Bold');
  });

  it('replaces what WinAnsi cannot hold', () => {
    const { text, bytes } = encodeWinAnsi('a → b ≤ c ∎ é 中');
    expect(text).toBe('a -> b <= c # é ?');
    expect(bytes).toContain(0xe9);
    expect(bytes.every(byte => byte >= 0 && byte <= 255)).toBe(true);
  });
});
