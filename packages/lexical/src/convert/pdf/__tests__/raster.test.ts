/**
 * @jest-environment jsdom
 */
/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * MathJax typesets TeX to SVG without a DOM, sized for the text it sits in
 * and with its baseline known; the rest of the raster helpers say no
 * politely where there is no canvas.
 */

import { describe, expect, it } from '@jest/globals';
import {
  canRaster,
  dataUrlToBytes,
  equationToRaster,
  mathToSvg,
  pdfFilename,
} from '../raster';

describe('mathToSvg', () => {
  it('typesets inline and display math with a size and a baseline', async () => {
    const inline = await mathToSvg('O(n \\log n)', false, 16);
    expect(inline).not.toBeNull();
    expect(inline!.svg.startsWith('<svg')).toBe(true);
    expect(inline!.svg).toContain(`width="${inline!.width}"`);
    expect(inline!.width).toBeGreaterThan(30);
    expect(inline!.height).toBeGreaterThan(10);
    // Parentheses hang below the baseline.
    expect(inline!.depth).toBeGreaterThan(0);
    const display = await mathToSvg('\\sum_{i=1}^{n} x_i', true, 16);
    expect(display!.height).toBeGreaterThan(inline!.height);
    // Bigger text, bigger picture.
    const large = await mathToSvg('O(n \\log n)', false, 32);
    expect(large!.width).toBeGreaterThan(inline!.width * 1.8);
  }, 30000);
});

describe('without a canvas', () => {
  it('draws nothing and says so', async () => {
    expect(canRaster()).toBe(false);
    expect(await equationToRaster('x', true)).toBeNull();
  });

  it('decodes data URLs and names files', () => {
    expect(Array.from(dataUrlToBytes('data:text/plain;base64,aGk='))).toEqual([
      104, 105,
    ]);
    expect(Array.from(dataUrlToBytes('data:text/plain,a%20b'))).toEqual([
      97, 32, 98,
    ]);
    expect(pdfFilename('My Title: Draft #2')).toBe('my-title-draft-2.pdf');
    expect(pdfFilename(undefined, 'x')).toBe('x.pdf');
  });
});
