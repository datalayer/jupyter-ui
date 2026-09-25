/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * A small PDF writer: pages, text in the standard fonts, lines and
 * rectangles, JPEG images, link annotations, document information. Enough
 * for a document exporter, in a few hundred lines and no dependency.
 *
 * Coordinates given to a page are from its top-left corner, in points, the
 * way a layout thinks; the writer turns them into PDF's bottom-left origin.
 * Text is written in WinAnsi with the standard 14 fonts, so nothing is
 * embedded and files stay small; characters outside Latin-1 are replaced
 * (see `fonts.ts`).
 *
 * @module convert/pdf/PdfWriter
 */

import { encodeWinAnsi, PDF_FONTS, type PdfFontName } from './fonts';

export interface PdfPageSize {
  width: number;
  height: number;
}

/** Page sizes in points. */
export const PAGE_SIZES: Record<'a4' | 'letter', PdfPageSize> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
};

export type PdfColor = string | [number, number, number];

export interface PdfWriterOptions {
  size?: PdfPageSize;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
}

/** A JPEG registered with the writer, to place on pages. */
export interface PdfImage {
  readonly id: number;
  readonly width: number;
  readonly height: number;
}

interface ImageObject extends PdfImage {
  bytes: Uint8Array;
}

/** `#rrggbb` or `[r, g, b]` (0–1) → `r g b` for the content stream. */
function rgb(color: PdfColor): string {
  if (typeof color === 'string') {
    const hex = color.replace('#', '');
    const full =
      hex.length === 3
        ? hex
            .split('')
            .map(c => c + c)
            .join('')
        : hex;
    const value = parseInt(full, 16);
    const r = ((value >> 16) & 255) / 255;
    const g = ((value >> 8) & 255) / 255;
    const b = (value & 255) / 255;
    return `${n(r)} ${n(g)} ${n(b)}`;
  }
  return color.map(n).join(' ');
}

/** A number for the content stream: short, no exponent. */
function n(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(3).replace(/\.?0+$/, '');
}

function hex(bytes: number[] | Uint8Array): string {
  let out = '';
  for (const byte of bytes) {
    out += byte.toString(16).padStart(2, '0');
  }
  return out;
}

/** A PDF text string as UTF-16BE hex with a byte-order mark. */
function utf16(text: string): string {
  const bytes: number[] = [0xfe, 0xff];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    bytes.push(code >> 8, code & 255);
  }
  return `<${hex(bytes)}>`;
}

function pdfDate(date: Date): string {
  const pad = (v: number) => String(v).padStart(2, '0');
  return `D:${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

export class PdfPage {
  readonly ops: string[] = [];
  readonly links: Array<{
    rect: [number, number, number, number];
    url: string;
  }> = [];
  readonly images = new Set<number>();

  constructor(
    readonly index: number,
    readonly width: number,
    readonly height: number,
    private readonly fontName: (font: PdfFontName) => string,
  ) {}

  /** `text` with its baseline at `y` from the top, starting at `x`. */
  text(
    x: number,
    y: number,
    text: string,
    font: PdfFontName,
    size: number,
    color: PdfColor = '#000000',
  ): void {
    const { bytes } = encodeWinAnsi(text);
    if (bytes.length === 0) {
      return;
    }
    this.ops.push(
      `BT ${rgb(color)} rg /${this.fontName(font)} ${n(size)} Tf 1 0 0 1 ${n(x)} ${n(this.height - y)} Tm <${hex(bytes)}> Tj ET`,
    );
  }

  /** A rectangle whose top-left corner is `(x, y)`. */
  rect(
    x: number,
    y: number,
    width: number,
    height: number,
    style: { fill?: PdfColor; stroke?: PdfColor; lineWidth?: number },
  ): void {
    const parts: string[] = ['q'];
    if (style.fill) {
      parts.push(`${rgb(style.fill)} rg`);
    }
    if (style.stroke) {
      parts.push(`${rgb(style.stroke)} RG ${n(style.lineWidth ?? 0.5)} w`);
    }
    parts.push(
      `${n(x)} ${n(this.height - y - height)} ${n(width)} ${n(height)} re`,
    );
    parts.push(style.fill && style.stroke ? 'B' : style.fill ? 'f' : 'S', 'Q');
    this.ops.push(parts.join(' '));
  }

  line(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: PdfColor = '#000000',
    lineWidth = 0.5,
  ): void {
    this.ops.push(
      `q ${rgb(color)} RG ${n(lineWidth)} w ${n(x1)} ${n(this.height - y1)} m ${n(x2)} ${n(this.height - y2)} l S Q`,
    );
  }

  /** `image` scaled into the box whose top-left corner is `(x, y)`. */
  image(
    image: PdfImage,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    this.images.add(image.id);
    this.ops.push(
      `q ${n(width)} 0 0 ${n(height)} ${n(x)} ${n(this.height - y - height)} cm /Im${image.id} Do Q`,
    );
  }

  /** A clickable area whose top-left corner is `(x, y)`. */
  link(x: number, y: number, width: number, height: number, url: string): void {
    this.links.push({
      rect: [x, this.height - y - height, x + width, this.height - y],
      url,
    });
  }
}

export class PdfWriter {
  readonly pages: PdfPage[] = [];
  readonly size: PdfPageSize;
  private readonly images: ImageObject[] = [];
  private readonly fonts = new Map<PdfFontName, string>();

  constructor(private readonly options: PdfWriterOptions = {}) {
    this.size = options.size ?? PAGE_SIZES.a4;
    PDF_FONTS.forEach((font, i) => this.fonts.set(font, `F${i + 1}`));
  }

  addPage(): PdfPage {
    const page = new PdfPage(
      this.pages.length,
      this.size.width,
      this.size.height,
      font => this.fonts.get(font) ?? 'F1',
    );
    this.pages.push(page);
    return page;
  }

  /** Register a JPEG (its pixel size must be given) for `PdfPage.image`. */
  addJpeg(bytes: Uint8Array, width: number, height: number): PdfImage {
    const image: ImageObject = {
      id: this.images.length + 1,
      width,
      height,
      bytes,
    };
    this.images.push(image);
    return image;
  }

  /** The finished file. */
  build(): Uint8Array {
    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [];
    let length = 0;
    const push = (part: string | Uint8Array) => {
      const bytes = typeof part === 'string' ? latin1(part) : part;
      chunks.push(bytes);
      length += bytes.length;
    };
    const offsets: number[] = [];
    const object = (id: number, body: string | Array<string | Uint8Array>) => {
      offsets[id] = length;
      push(`${id} 0 obj\n`);
      if (typeof body === 'string') {
        push(body);
      } else {
        body.forEach(push);
      }
      push('\nendobj\n');
    };

    // Object numbers: 1 catalog, 2 pages, 3 info, then fonts, images, and
    // per page: the page, its content, its annotations.
    let next = 4;
    const fontIds = new Map<PdfFontName, number>();
    for (const font of PDF_FONTS) {
      fontIds.set(font, next++);
    }
    const imageIds = new Map<number, number>();
    for (const image of this.images) {
      imageIds.set(image.id, next++);
    }
    const pageIds = this.pages.map(() => {
      const id = next;
      next += 2;
      return id;
    });
    const annotIds = this.pages.map(page => {
      const ids = page.links.map(() => next++);
      return ids;
    });

    push('%PDF-1.4\n%âãÏÓ\n');
    object(1, '<< /Type /Catalog /Pages 2 0 R >>');
    object(
      2,
      `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${this.pages.length} >>`,
    );
    const info = [
      this.options.title ? `/Title ${utf16(this.options.title)}` : '',
      this.options.author ? `/Author ${utf16(this.options.author)}` : '',
      this.options.subject ? `/Subject ${utf16(this.options.subject)}` : '',
      `/Creator ${utf16(this.options.creator ?? 'Jupyter Lexical')}`,
      '/Producer (Jupyter Lexical PdfWriter)',
      `/CreationDate (${pdfDate(new Date())})`,
    ]
      .filter(Boolean)
      .join(' ');
    object(3, `<< ${info} >>`);

    for (const font of PDF_FONTS) {
      object(
        fontIds.get(font) as number,
        `<< /Type /Font /Subtype /Type1 /BaseFont /${font} /Encoding /WinAnsiEncoding >>`,
      );
    }
    for (const image of this.images) {
      object(imageIds.get(image.id) as number, [
        `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n`,
        image.bytes,
        '\nendstream',
      ]);
    }

    const fontResources = PDF_FONTS.map(
      font => `/${this.fonts.get(font)} ${fontIds.get(font)} 0 R`,
    ).join(' ');
    this.pages.forEach((page, i) => {
      const pageId = pageIds[i];
      const contentId = pageId + 1;
      const xobjects = Array.from(page.images)
        .map(id => `/Im${id} ${imageIds.get(id)} 0 R`)
        .join(' ');
      const annots = annotIds[i].length
        ? ` /Annots [${annotIds[i].map(id => `${id} 0 R`).join(' ')}]`
        : '';
      object(
        pageId,
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(page.width)} ${n(page.height)}] /Resources << /Font << ${fontResources} >>${xobjects ? ` /XObject << ${xobjects} >>` : ''} >> /Contents ${contentId} 0 R${annots} >>`,
      );
      const content = encoder.encode(page.ops.join('\n'));
      object(contentId, [
        `<< /Length ${content.length} >>\nstream\n`,
        content,
        '\nendstream',
      ]);
      page.links.forEach((link, j) => {
        object(
          annotIds[i][j],
          `<< /Type /Annot /Subtype /Link /Rect [${link.rect.map(n).join(' ')}] /Border [0 0 0] /A << /S /URI /URI ${utf16(link.url)} >> >>`,
        );
      });
    });

    const xref = length;
    const count = next;
    let table = `xref\n0 ${count}\n0000000000 65535 f \n`;
    for (let id = 1; id < count; id++) {
      table += `${String(offsets[id] ?? 0).padStart(10, '0')} 00000 n \n`;
    }
    push(table);
    push(
      `trailer\n<< /Size ${count} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`,
    );

    const out = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }
}

/** A string of code points ≤ 0xFF as bytes. */
function latin1(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    bytes[i] = text.charCodeAt(i) & 255;
  }
  return bytes;
}

/** How many pages a PDF made by this writer (or any uncompressed one) has. */
export function countPdfPages(bytes: Uint8Array): number {
  let text = '';
  const step = 8192;
  for (let i = 0; i < bytes.length; i += step) {
    text += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + step)),
    );
  }
  // The page tree's `/Count`: the first `/Type /Pages` whose dictionary,
  // up to the next `>`, carries one. Scanned once — each stretch of text is
  // read by one candidate, since later `/Type /Pages` before the same `>`
  // lie inside the stretch the earlier one already read.
  const pages = /\/Type\s*\/Pages/g;
  for (let found = pages.exec(text); found; found = pages.exec(text)) {
    const close = text.indexOf('>', found.index);
    const end = close < 0 ? text.length : close;
    const count = /\/Count\s+(\d+)/.exec(text.slice(found.index, end));
    if (count) {
      return Number(count[1]);
    }
    pages.lastIndex = end;
  }
  return (text.match(/\/Type\s*\/Page\b/g) ?? []).length;
}
