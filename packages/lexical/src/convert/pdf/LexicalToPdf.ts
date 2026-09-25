/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Lexical → PDF, from the document model.
 *
 * A small layout engine sets the document's blocks on pages with the
 * standard fonts: headings, paragraphs with their formats and links, quotes,
 * lists and check lists, code and Jupyter inputs, tables with spanning
 * cells, columns, rules, collapsibles; pictures — equations, images,
 * drawings, rich outputs — are drawn by the browser first and placed as
 * JPEGs. The text stays text: selectable, searchable, small.
 *
 * Reading the editor and laying out are synchronous; only the pictures are
 * awaited, between the two.
 *
 * @module convert/pdf/LexicalToPdf
 */

import type { LexicalEditor } from 'lexical';
import * as nbformat from '@jupyterlab/nbformat';
import { fontFor, textWidth, type PdfFontName } from './fonts';
import {
  PAGE_SIZES,
  PdfWriter,
  type PdfColor,
  type PdfImage,
  type PdfPage,
  type PdfPageSize,
} from './PdfWriter';
import {
  inlineText,
  readDocument,
  type Alignment,
  type Block,
  type DocumentModel,
  type InlineRun,
  type ListItemModel,
  type TableCellModel,
} from './documentModel';
import {
  canRaster,
  canvasElementToRaster,
  canvasToJpeg,
  elementToRaster,
  equationToRaster,
  imageToRaster,
  inlineSvgOf,
  svgToRaster,
  type Raster,
} from './raster';

export interface PdfDocumentOptions {
  size?: 'a4' | 'letter' | PdfPageSize;
  /** Page margin in points; 56 (about 2 cm) by default. */
  margin?: number;
  /** Body text size in points; 11 by default. */
  fontSize?: number;
  title?: string;
  author?: string;
  /** Page numbers in the footer (default true). */
  pageNumbers?: boolean;
  /** Draw equations, images, drawings and rich outputs (default true). */
  pictures?: boolean;
  /**
   * The rendered element of a node, for pictures of drawings and outputs;
   * `editor.getElementByKey` by default.
   */
  resolveElement?: (key: string) => HTMLElement | null;
}

/** A picture ready for the writer, with its size on screen. */
export interface PdfPicture {
  jpeg: Uint8Array;
  pxWidth: number;
  pxHeight: number;
  cssWidth: number;
  cssHeight: number;
  /** For an equation: CSS pixels hanging below the text baseline. */
  depth?: number;
}

/** Pictures by node key (outputs: `key:index`). */
export type PdfPictures = Map<string, PdfPicture>;

const COLORS = {
  text: '#1f2328',
  muted: '#57606a',
  link: '#0969da',
  border: '#d0d7de',
  codeBackground: '#f6f8fa',
  highlight: '#fff8c5',
  error: '#cf222e',
};

const HEADING_SIZES: Record<number, number> = {
  1: 22,
  2: 17,
  3: 14,
  4: 12.5,
  5: 11.5,
  6: 11,
};

const POINTS_PER_PIXEL = 0.75;

interface TextStyle {
  size: number;
  color: PdfColor;
  bold?: boolean;
  italic?: boolean;
  mono?: boolean;
  align?: Alignment;
  indent?: number;
  spaceAfter?: number;
  lineHeight?: number;
}

type LineItem =
  | {
      kind: 'text';
      text: string;
      width: number;
      font: PdfFontName;
      size: number;
      color: PdfColor;
      link?: string;
      underline?: boolean;
      strike?: boolean;
      shift: number;
      background?: PdfColor;
      space: boolean;
    }
  | {
      kind: 'picture';
      picture: PdfPicture;
      width: number;
      height: number;
      /** Points below the baseline; centred in the line when undefined. */
      depth?: number;
    }
  | { kind: 'newline' };

interface Line {
  items: LineItem[];
  width: number;
  height: number;
}

function pageSize(size: PdfDocumentOptions['size']): PdfPageSize {
  if (!size) {
    return PAGE_SIZES.a4;
  }
  return typeof size === 'string' ? PAGE_SIZES[size] : size;
}

async function toPicture(raster: Raster | null): Promise<PdfPicture | null> {
  if (!raster) {
    return null;
  }
  return {
    jpeg: await canvasToJpeg(raster.canvas),
    pxWidth: raster.canvas.width,
    pxHeight: raster.canvas.height,
    cssWidth: raster.cssWidth,
    cssHeight: raster.cssHeight,
    depth: raster.depth,
  };
}

/** Draw every picture the document needs, keyed by node key. */
export async function collectPictures(
  document: DocumentModel,
  editor: LexicalEditor,
  options: PdfDocumentOptions = {},
): Promise<PdfPictures> {
  const pictures: PdfPictures = new Map();
  if (options.pictures === false || !canRaster()) {
    return pictures;
  }
  const element = (key: string) =>
    options.resolveElement
      ? options.resolveElement(key)
      : editor.getElementByKey(key);
  const bodyPx = (options.fontSize ?? 11) / POINTS_PER_PIXEL;
  const put = async (
    key: string,
    raster: Promise<Raster | null> | Raster | null,
  ) => {
    const picture = await toPicture(await raster);
    if (picture) {
      pictures.set(key, picture);
    }
  };
  const inlines = async (runs: InlineRun[]) => {
    for (const run of runs) {
      if (run.kind === 'equation') {
        await put(run.key, equationToRaster(run.equation, true, 3, bodyPx));
      }
    }
  };
  const blocks = async (list: Block[]) => {
    for (const block of list) {
      switch (block.kind) {
        case 'heading':
        case 'paragraph':
          await inlines(block.inlines);
          break;
        case 'quote':
        case 'collapsible':
          await blocks(block.blocks);
          break;
        case 'list':
          for (const item of block.items) {
            await blocks(item.blocks);
          }
          break;
        case 'table':
          for (const row of block.rows) {
            for (const cell of row) {
              await inlines(cell.inlines);
            }
          }
          break;
        case 'columns':
          for (const column of block.columns) {
            await blocks(column);
          }
          break;
        case 'equation':
          await put(block.key, equationToRaster(block.equation, false));
          break;
        case 'image':
          await put(block.key, imageToRaster(block.src));
          break;
        case 'drawing': {
          const el = element(block.key);
          if (el) {
            const canvas = el.querySelector('canvas');
            const svg = canvas ? null : inlineSvgOf(el);
            await put(
              block.key,
              (canvas && canvasElementToRaster(canvas)) ??
                (svg ? svgToRaster(svg, 2) : elementToRaster(el, 2)),
            );
          }
          break;
        }
        case 'outputs': {
          for (const [i, output] of block.outputs.entries()) {
            if (
              !nbformat.isDisplayData(output) &&
              !nbformat.isExecuteResult(output)
            ) {
              continue;
            }
            const data = output.data;
            const png = data['image/png'];
            const jpeg = data['image/jpeg'];
            const svg = data['image/svg+xml'];
            const key = `${block.key}:${i}`;
            if (typeof png === 'string') {
              await put(
                key,
                imageToRaster(
                  `data:image/png;base64,${png.replace(/\s/g, '')}`,
                ),
              );
            } else if (typeof jpeg === 'string') {
              await put(
                key,
                imageToRaster(
                  `data:image/jpeg;base64,${jpeg.replace(/\s/g, '')}`,
                ),
              );
            } else if (svg !== undefined) {
              await put(
                key,
                svgToRaster(Array.isArray(svg) ? svg.join('') : String(svg)),
              );
            } else if (typeof data['text/latex'] === 'string') {
              await put(
                key,
                equationToRaster(
                  String(data['text/latex']).replace(/^\$+|\$+$/g, ''),
                  false,
                ),
              );
            } else if (data['text/html'] !== undefined) {
              const el = element(block.key);
              const area =
                el?.querySelector<HTMLElement>(
                  '.jp-OutputArea, .jp-RenderedHTMLCommon',
                ) ?? el;
              if (area) {
                await put(key, elementToRaster(area, 2));
              }
            }
          }
          break;
        }
        default:
          break;
      }
    }
  };
  await blocks(document.blocks);
  return pictures;
}

/** Adjacent text items of one style joined: one operator, one link, one line. */
function coalesce(items: LineItem[]): LineItem[] {
  const out: LineItem[] = [];
  for (const item of items) {
    const last = out[out.length - 1];
    if (
      item.kind === 'text' &&
      last &&
      last.kind === 'text' &&
      last.font === item.font &&
      last.size === item.size &&
      last.color === item.color &&
      last.shift === item.shift &&
      last.link === item.link &&
      !!last.underline === !!item.underline &&
      !!last.strike === !!item.strike &&
      last.background === item.background
    ) {
      out[out.length - 1] = {
        ...last,
        text: last.text + item.text,
        width: last.width + item.width,
        space: last.space && item.space,
      };
    } else {
      out.push({ ...item });
    }
  }
  return out;
}

/** Where the cursor is: a page and a distance from its top. */
interface Cursor {
  page: number;
  y: number;
}

class PdfLayout {
  readonly writer: PdfWriter;
  private pageIndex = 0;
  y: number;
  x: number;
  width: number;
  private readonly margin: number;
  private readonly bottom: number;
  private readonly baseSize: number;
  private readonly images = new Map<PdfPicture, PdfImage>();
  private textColor: PdfColor = COLORS.text;

  constructor(
    private readonly options: PdfDocumentOptions,
    private readonly pictures: PdfPictures,
  ) {
    const size = pageSize(options.size);
    this.writer = new PdfWriter({
      size,
      title: options.title,
      author: options.author,
    });
    this.margin = options.margin ?? 56;
    this.baseSize = options.fontSize ?? 11;
    this.bottom =
      size.height - this.margin - (options.pageNumbers === false ? 0 : 14);
    this.writer.addPage();
    this.y = this.margin;
    this.x = this.margin;
    this.width = size.width - 2 * this.margin;
  }

  get page(): PdfPage {
    return this.writer.pages[this.pageIndex];
  }

  get cursor(): Cursor {
    return { page: this.pageIndex, y: this.y };
  }

  set cursor(cursor: Cursor) {
    this.pageIndex = cursor.page;
    this.y = cursor.y;
  }

  private get remaining(): number {
    return this.bottom - this.y;
  }

  /** Move to the next page, making it if it does not exist yet. */
  newPage(): void {
    if (this.pageIndex + 1 >= this.writer.pages.length) {
      this.writer.addPage();
    }
    this.pageIndex += 1;
    this.y = this.margin;
  }

  /** Make room for `height`; a block taller than a page starts one anyway. */
  ensure(height: number): void {
    if (height > this.remaining && this.y > this.margin + 0.5) {
      this.newPage();
    }
  }

  private image(picture: PdfPicture): PdfImage {
    let image = this.images.get(picture);
    if (!image) {
      image = this.writer.addJpeg(
        picture.jpeg,
        picture.pxWidth,
        picture.pxHeight,
      );
      this.images.set(picture, image);
    }
    return image;
  }

  // ── Text ────────────────────────────────────────────────────────────

  private items(runs: InlineRun[], style: TextStyle): LineItem[] {
    const items: LineItem[] = [];
    for (const run of runs) {
      if (run.kind === ('newline' as never)) {
        continue;
      }
      if (run.kind === 'break') {
        items.push({ kind: 'newline' });
        continue;
      }
      if (run.kind === 'equation') {
        const picture = this.pictures.get(run.key);
        if (picture) {
          const natural = picture.cssHeight * POINTS_PER_PIXEL;
          const height = Math.min(natural, style.size * 2.2);
          const factor = height / natural;
          const width = picture.cssWidth * POINTS_PER_PIXEL * factor;
          items.push({
            kind: 'picture',
            picture,
            width,
            height,
            depth:
              picture.depth === undefined
                ? undefined
                : picture.depth * POINTS_PER_PIXEL * factor,
          });
        } else {
          items.push(
            ...this.items(
              [{ kind: 'text', text: run.equation, code: true }],
              style,
            ),
          );
        }
        continue;
      }
      const bold = style.bold || run.bold;
      const italic = style.italic || run.italic;
      const mono = style.mono || run.code;
      const font = fontFor({ bold, italic, code: mono });
      const scale = run.subscript || run.superscript ? 0.72 : 1;
      const size = style.size * scale * (mono && !style.mono ? 0.92 : 1);
      const shift = run.superscript
        ? -style.size * 0.35
        : run.subscript
          ? style.size * 0.15
          : 0;
      const color = run.link ? COLORS.link : style.color;
      const background = run.highlight
        ? COLORS.highlight
        : mono && !style.mono
          ? COLORS.codeBackground
          : undefined;
      for (const token of run.text.split(/(\s+)/)) {
        if (!token) {
          continue;
        }
        const space = /^\s+$/.test(token);
        items.push({
          kind: 'text',
          text: space ? ' ' : token,
          width: textWidth(space ? ' ' : token, font, size),
          font,
          size,
          color,
          link: run.link,
          underline: run.underline || !!run.link,
          strike: run.strikethrough,
          shift,
          background,
          space,
        });
      }
    }
    return items;
  }

  private splitWord(
    item: Extract<LineItem, { kind: 'text' }>,
    width: number,
  ): LineItem[] {
    const parts: LineItem[] = [];
    let chunk = '';
    for (const char of item.text) {
      const next = chunk + char;
      if (chunk && textWidth(next, item.font, item.size) > width) {
        parts.push({
          ...item,
          text: chunk,
          width: textWidth(chunk, item.font, item.size),
        });
        chunk = char;
      } else {
        chunk = next;
      }
    }
    if (chunk) {
      parts.push({
        ...item,
        text: chunk,
        width: textWidth(chunk, item.font, item.size),
      });
    }
    return parts;
  }

  /** Items wrapped into lines of at most `width`. */
  private wrap(items: LineItem[], width: number, style: TextStyle): Line[] {
    const lineHeight = (style.lineHeight ?? 1.4) * style.size;
    const lines: Line[] = [];
    let current: LineItem[] = [];
    let currentWidth = 0;
    const flush = () => {
      while (
        current.length &&
        current[current.length - 1].kind === 'text' &&
        (current[current.length - 1] as { space: boolean }).space
      ) {
        currentWidth -= (current.pop() as { width: number }).width;
      }
      const height = Math.max(
        lineHeight,
        ...current.map(item =>
          item.kind === 'picture'
            ? item.depth === undefined
              ? item.height + 2
              : // Above the baseline it needs height − depth; the baseline
                // sits at about 70% of the line.
                (item.height - item.depth) / 0.7 + 1
            : 0,
        ),
      );
      lines.push({ items: current, width: currentWidth, height });
      current = [];
      currentWidth = 0;
    };
    const queue = [...items];
    while (queue.length) {
      const item = queue.shift() as LineItem;
      if (item.kind === 'newline') {
        flush();
        continue;
      }
      if (item.kind === 'text' && item.space) {
        if (current.length) {
          current.push(item);
          currentWidth += item.width;
        }
        continue;
      }
      if (currentWidth + item.width > width && current.length) {
        flush();
      }
      if (item.kind === 'text' && item.width > width) {
        queue.unshift(...this.splitWord(item, width));
        continue;
      }
      current.push(item);
      currentWidth += item.width;
    }
    if (current.length || lines.length === 0) {
      flush();
    }
    return lines;
  }

  /** The height `runs` take at `width`, without drawing. */
  measure(runs: InlineRun[], width: number, style: TextStyle): number {
    const lines = this.wrap(this.items(runs, style), width, style);
    return lines.reduce((sum, line) => sum + line.height, 0);
  }

  private drawLine(
    line: Line,
    x: number,
    width: number,
    style: TextStyle,
  ): void {
    const offset =
      style.align === 'center'
        ? (width - line.width) / 2
        : style.align === 'right'
          ? width - line.width
          : 0;
    let cx = x + Math.max(0, offset);
    const baseline =
      this.y + line.height - (line.height - style.size) / 2 - style.size * 0.22;
    for (const item of coalesce(line.items)) {
      if (item.kind === 'picture') {
        const top =
          item.depth === undefined
            ? this.y + (line.height - item.height) / 2
            : Math.max(this.y, baseline + item.depth - item.height);
        this.page.image(
          this.image(item.picture),
          cx,
          top,
          item.width,
          item.height,
        );
        cx += item.width;
        continue;
      }
      if (item.kind === 'newline') {
        continue;
      }
      if (item.background && !item.space) {
        this.page.rect(
          cx - 1,
          baseline - item.size * 0.8,
          item.width + 2,
          item.size * 1.1,
          {
            fill: item.background,
          },
        );
      }
      this.page.text(
        cx,
        baseline + item.shift,
        item.text,
        item.font,
        item.size,
        item.color,
      );
      if (item.underline && !item.space) {
        this.page.line(
          cx,
          baseline + 1.5,
          cx + item.width,
          baseline + 1.5,
          item.color,
          0.5,
        );
      }
      if (item.strike && !item.space) {
        const mid = baseline - item.size * 0.3;
        this.page.line(cx, mid, cx + item.width, mid, item.color, 0.5);
      }
      if (item.link && !item.space) {
        this.page.link(cx, this.y, item.width, line.height, item.link);
      }
      cx += item.width;
    }
  }

  /** Text runs as a paragraph at the cursor, wrapped and paged. */
  paragraph(
    runs: InlineRun[],
    style: TextStyle,
    marker?: (baseline: number) => void,
  ): void {
    const indent = style.indent ?? 0;
    const x = this.x + indent;
    const width = this.width - indent;
    const lines = this.wrap(this.items(runs, style), width, style);
    lines.forEach((line, i) => {
      this.ensure(line.height + (i === 0 ? 0 : 0));
      if (i === 0 && marker) {
        marker(
          this.y +
            line.height -
            (line.height - style.size) / 2 -
            style.size * 0.22,
        );
      }
      this.drawLine(line, x, width, style);
      this.y += line.height;
    });
    this.y += style.spaceAfter ?? style.size * 0.55;
  }

  // ── Blocks ──────────────────────────────────────────────────────────

  private bodyStyle(overrides: Partial<TextStyle> = {}): TextStyle {
    return { size: this.baseSize, color: this.textColor, ...overrides };
  }

  blocks(blocks: Block[], depth = 0): void {
    blocks.forEach((block, i) => this.block(block, depth, blocks[i + 1]));
  }

  block(block: Block, depth: number, next?: Block): void {
    switch (block.kind) {
      case 'heading': {
        const size = HEADING_SIZES[block.level] ?? this.baseSize;
        const before = this.y > this.margin + 0.5 ? size * 0.6 : 0;
        const style = this.bodyStyle({
          size,
          bold: true,
          align: block.align,
          indent: block.indent * 18,
          spaceAfter: size * 0.4,
          lineHeight: 1.25,
        });
        // Keep with the next block: room for the heading and two lines.
        this.ensure(
          before +
            this.measure(block.inlines, this.width, style) +
            this.baseSize * 2.8,
        );
        this.y += this.y > this.margin + 0.5 ? before : 0;
        this.paragraph(block.inlines, style);
        void next;
        return;
      }
      case 'paragraph':
        if (block.inlines.length === 0) {
          this.y += this.baseSize * 0.6;
          return;
        }
        this.paragraph(
          block.inlines,
          this.bodyStyle({ align: block.align, indent: block.indent * 18 }),
        );
        return;
      case 'quote':
        this.barred(() => {
          const color = this.textColor;
          this.textColor = COLORS.muted;
          this.indented(14, () => this.blocks(block.blocks, depth));
          this.textColor = color;
        }, COLORS.border);
        return;
      case 'list':
        this.list(block.ordered, block.start, block.items, depth);
        return;
      case 'code':
        this.code(
          block.text,
          block.language,
          block.executable ? COLORS.codeBackground : '#f6f8fa',
          COLORS.text,
        );
        return;
      case 'outputs':
        this.outputs(block.outputs, block.key);
        return;
      case 'table':
        this.table(block.rows);
        return;
      case 'columns':
        this.columns(block.weights, block.columns, depth);
        return;
      case 'rule':
        this.ensure(14);
        this.page.line(
          this.x,
          this.y + 7,
          this.x + this.width,
          this.y + 7,
          COLORS.border,
          0.75,
        );
        this.y += 14;
        return;
      case 'image':
        this.picture(
          this.pictures.get(block.key),
          block.alt || 'Image',
          block.alt,
          'left',
        );
        return;
      case 'equation': {
        const picture = this.pictures.get(block.key);
        if (picture) {
          this.picture(
            picture,
            block.equation,
            undefined,
            'center',
            this.baseSize * 4,
          );
        } else {
          this.paragraph(
            [{ kind: 'text', text: block.equation, code: true }],
            this.bodyStyle({
              align: 'center',
              mono: true,
              size: this.baseSize * 0.95,
            }),
          );
        }
        return;
      }
      case 'collapsible':
        this.boxed(() => {
          this.paragraph(
            block.title,
            this.bodyStyle({ bold: true, spaceAfter: this.baseSize * 0.4 }),
          );
          this.blocks(block.blocks, depth);
        });
        return;
      case 'embed': {
        const height = 30;
        this.ensure(height + 8);
        this.page.rect(this.x, this.y, this.width, height, {
          stroke: COLORS.border,
          fill: '#fafbfc',
        });
        const style = this.bodyStyle({ align: 'center', color: COLORS.link });
        const label: InlineRun[] = [
          { kind: 'text', text: block.label, link: block.url },
        ];
        const lines = this.wrap(
          this.items(label, style),
          this.width - 16,
          style,
        );
        this.y += (height - lines[0].height) / 2;
        this.drawLine(lines[0], this.x + 8, this.width - 16, style);
        this.y += lines[0].height + (height - lines[0].height) / 2 + 8;
        return;
      }
      case 'drawing':
        this.picture(
          this.pictures.get(block.key),
          block.label,
          undefined,
          'center',
        );
        return;
      default:
        return;
    }
  }

  private indented(by: number, fn: () => void): void {
    const { x, width } = this;
    this.x += by;
    this.width -= by;
    fn();
    this.x = x;
    this.width = width;
  }

  /** The pages and vertical extents `fn` covered, for decorations. */
  private extents(
    fn: () => void,
  ): Array<{ page: PdfPage; top: number; bottom: number }> {
    const start = this.cursor;
    fn();
    const end = this.cursor;
    const segments: Array<{ page: PdfPage; top: number; bottom: number }> = [];
    for (let p = start.page; p <= end.page; p++) {
      segments.push({
        page: this.writer.pages[p],
        top: p === start.page ? start.y : this.margin,
        bottom: p === end.page ? end.y : this.bottom,
      });
    }
    return segments.filter(segment => segment.bottom > segment.top + 1);
  }

  /** `fn`'s content with a bar down its left side. */
  private barred(fn: () => void, color: PdfColor): void {
    this.y += 2;
    for (const segment of this.extents(fn)) {
      segment.page.rect(
        this.x,
        segment.top,
        3,
        segment.bottom - segment.top - 4,
        { fill: color },
      );
    }
    this.y += 4;
  }

  /** `fn`'s content in a bordered box. */
  private boxed(fn: () => void): void {
    this.ensure(this.baseSize * 4);
    this.y += 4;
    const segments = this.extents(() => {
      this.y += 8;
      this.indented(10, () => {
        this.width -= 10;
        fn();
        this.width += 10;
      });
      this.y += 2;
    });
    for (const segment of segments) {
      segment.page.rect(
        this.x,
        segment.top,
        this.width,
        segment.bottom - segment.top,
        {
          stroke: COLORS.border,
          lineWidth: 0.75,
        },
      );
    }
    this.y += 10;
  }

  private list(
    ordered: boolean,
    start: number,
    items: ListItemModel[],
    depth: number,
  ): void {
    const gutter = 18;
    const markerText = (i: number) =>
      ordered
        ? `${start + i}.`
        : depth % 3 === 0
          ? '•'
          : depth % 3 === 1
            ? '–'
            : '·';
    const markerX = this.x;
    items.forEach((item, i) => {
      const [first, ...rest] = item.blocks;
      const drawMarker = (baseline: number) => {
        if (item.checked !== null) {
          const side = this.baseSize * 0.8;
          const top = baseline - side + 1;
          this.page.rect(markerX, top, side, side, {
            stroke: COLORS.muted,
            fill: item.checked ? COLORS.muted : undefined,
          });
          if (item.checked) {
            this.page.line(
              markerX + side * 0.22,
              top + side * 0.55,
              markerX + side * 0.42,
              top + side * 0.75,
              '#ffffff',
              1.2,
            );
            this.page.line(
              markerX + side * 0.42,
              top + side * 0.75,
              markerX + side * 0.8,
              top + side * 0.28,
              '#ffffff',
              1.2,
            );
          }
          return;
        }
        const text = markerText(i);
        const font = fontFor({});
        const width = textWidth(text, font, this.baseSize);
        this.page.text(
          markerX + gutter - width - 5,
          baseline,
          text,
          font,
          this.baseSize,
          this.textColor,
        );
      };
      this.indented(gutter, () => {
        if (first && first.kind === 'paragraph') {
          this.paragraph(
            first.inlines,
            this.bodyStyle({ spaceAfter: this.baseSize * 0.25 }),
            drawMarker,
          );
        } else {
          this.paragraph([], this.bodyStyle({ spaceAfter: 0 }), drawMarker);
          if (first) {
            this.block(first, depth + 1);
          }
        }
        this.blocks(rest, depth + 1);
      });
    });
    this.y += this.baseSize * 0.3;
  }

  private code(
    text: string,
    language: string | null,
    background: PdfColor,
    color: PdfColor,
  ): void {
    const size = this.baseSize * 0.86;
    const lineHeight = size * 1.35;
    const padding = 8;
    const font: PdfFontName = 'Courier';
    const maxChars = Math.max(
      10,
      Math.floor((this.width - 2 * padding) / (0.6 * size)),
    );
    const lines: string[] = [];
    for (const raw of text.replace(/\t/g, '    ').split('\n')) {
      if (raw.length <= maxChars) {
        lines.push(raw);
      } else {
        for (let i = 0; i < raw.length; i += maxChars) {
          lines.push(raw.slice(i, i + maxChars));
        }
      }
    }
    if (lines.length === 0) {
      return;
    }
    this.ensure(Math.min(lines.length, 4) * lineHeight + 2 * padding);
    let i = 0;
    let first = true;
    while (i < lines.length) {
      const fit = Math.max(
        1,
        Math.floor((this.remaining - 2 * padding) / lineHeight),
      );
      const chunk = lines.slice(i, i + fit);
      const height = chunk.length * lineHeight + 2 * padding;
      this.page.rect(this.x, this.y, this.width, height, { fill: background });
      if (first && language) {
        const label = language;
        this.page.text(
          this.x + this.width - textWidth(label, 'Helvetica', 7) - 6,
          this.y + 9,
          label,
          'Helvetica',
          7,
          COLORS.muted,
        );
      }
      chunk.forEach((line, j) => {
        this.page.text(
          this.x + padding,
          this.y + padding + (j + 0.8) * lineHeight,
          line,
          font,
          size,
          color,
        );
      });
      this.y += height;
      i += chunk.length;
      first = false;
      if (i < lines.length) {
        this.newPage();
      }
    }
    this.y += this.baseSize * 0.6;
  }

  private outputs(outputs: nbformat.IOutput[], key: string): void {
    outputs.forEach((output, i) => {
      if (nbformat.isStream(output)) {
        const text = (
          Array.isArray(output.text) ? output.text.join('') : output.text
        ).trimEnd();
        if (text) {
          this.code(
            text,
            null,
            '#ffffff',
            output.name === 'stderr' ? COLORS.error : COLORS.text,
          );
        }
      } else if (nbformat.isError(output)) {
        const text = output.traceback
          .join('\n')
          .replace(
            new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g'),
            '',
          );
        this.code(text, null, '#fff5f5', COLORS.error);
      } else if (
        nbformat.isDisplayData(output) ||
        nbformat.isExecuteResult(output)
      ) {
        const picture = this.pictures.get(`${key}:${i}`);
        if (picture) {
          this.picture(picture, 'Output', undefined, 'left');
          return;
        }
        const data = output.data;
        const plain = data['text/plain'];
        if (typeof data['text/latex'] === 'string') {
          this.paragraph(
            [{ kind: 'text', text: String(data['text/latex']), code: true }],
            this.bodyStyle({ mono: true, size: this.baseSize * 0.9 }),
          );
        } else if (plain !== undefined) {
          this.code(
            Array.isArray(plain) ? plain.join('') : String(plain),
            null,
            '#ffffff',
            COLORS.text,
          );
        }
      }
    });
  }

  /** A picture scaled into the column, or a placeholder naming it. */
  private picture(
    picture: PdfPicture | undefined,
    label: string,
    caption: string | undefined,
    align: 'left' | 'center',
    maxHeight = this.bottom - this.margin - 20,
  ): void {
    if (!picture) {
      const height = 36;
      this.ensure(height + 8);
      this.page.rect(this.x, this.y, this.width, height, {
        stroke: COLORS.border,
        fill: '#fafbfc',
      });
      const style = this.bodyStyle({
        align: 'center',
        color: COLORS.muted,
        italic: true,
      });
      const lines = this.wrap(
        this.items([{ kind: 'text', text: label }], style),
        this.width - 16,
        style,
      );
      const saved = this.y;
      this.y += (height - lines[0].height) / 2;
      this.drawLine(lines[0], this.x + 8, this.width - 16, style);
      this.y = saved + height + 8;
      return;
    }
    let width = Math.min(this.width, picture.cssWidth * POINTS_PER_PIXEL);
    let height = (width * picture.pxHeight) / picture.pxWidth;
    const limit = Math.min(maxHeight, this.bottom - this.margin - 20);
    if (height > limit) {
      height = limit;
      width = (height * picture.pxWidth) / picture.pxHeight;
    }
    this.ensure(height + 8);
    const x = align === 'center' ? this.x + (this.width - width) / 2 : this.x;
    this.page.image(this.image(picture), x, this.y, width, height);
    this.y += height + 4;
    if (caption) {
      this.paragraph(
        [{ kind: 'text', text: caption, italic: true }],
        this.bodyStyle({
          size: this.baseSize * 0.9,
          color: COLORS.muted,
          align: 'center',
        }),
      );
    } else {
      this.y += 6;
    }
  }

  private table(rows: TableCellModel[][]): void {
    if (rows.length === 0) {
      return;
    }
    const columns = Math.max(
      1,
      ...rows.map(row => row.reduce((n, cell) => n + cell.colSpan, 0)),
    );
    // Column widths follow the longest content, within reason.
    const weights = Array.from({ length: columns }, () => 3);
    for (const row of rows) {
      let column = 0;
      for (const cell of row) {
        if (cell.colSpan === 1) {
          const longest = Math.max(
            ...inlineText(cell.inlines)
              .split('\n')
              .map(l => l.length),
            0,
          );
          weights[column] = Math.max(weights[column], Math.min(longest, 40));
        }
        column += cell.colSpan;
      }
    }
    const total = weights.reduce((a, b) => a + b, 0);
    const widths = weights.map(w => Math.max(30, (w / total) * this.width));
    const sum = widths.reduce((a, b) => a + b, 0);
    const scaled = widths.map(w => (w / sum) * this.width);
    const padding = 4;
    const size = this.baseSize * 0.92;
    const header = rows[0].every(cell => cell.header) ? rows[0] : null;

    const rowHeight = (row: TableCellModel[]) => {
      let column = 0;
      let height = size * 1.4 + 2 * padding;
      for (const cell of row) {
        const width = scaled
          .slice(column, column + cell.colSpan)
          .reduce((a, b) => a + b, 0);
        const style = this.bodyStyle({ size, bold: cell.header });
        height = Math.max(
          height,
          this.measure(cell.inlines, width - 2 * padding, style) + 2 * padding,
        );
        column += cell.colSpan;
      }
      return height;
    };

    const drawRow = (row: TableCellModel[], height: number) => {
      let column = 0;
      let x = this.x;
      const top = this.y;
      for (const cell of row) {
        const width = scaled
          .slice(column, column + cell.colSpan)
          .reduce((a, b) => a + b, 0);
        this.page.rect(x, top, width, height, {
          stroke: COLORS.border,
          fill: cell.header ? COLORS.codeBackground : undefined,
        });
        const style = this.bodyStyle({
          size,
          bold: cell.header,
          spaceAfter: 0,
        });
        const saved = { x: this.x, width: this.width, y: this.y };
        this.x = x + padding;
        this.width = width - 2 * padding;
        this.y = top + padding;
        const lines = this.wrap(
          this.items(cell.inlines, style),
          this.width,
          style,
        );
        for (const line of lines) {
          this.drawLine(line, this.x, this.width, style);
          this.y += line.height;
        }
        this.x = saved.x;
        this.width = saved.width;
        this.y = saved.y;
        x += width;
        column += cell.colSpan;
      }
      this.y = top + height;
    };

    this.ensure(rowHeight(rows[0]) + (rows[1] ? rowHeight(rows[1]) : 0));
    rows.forEach((row, index) => {
      const height = rowHeight(row);
      if (height > this.remaining && this.y > this.margin + 0.5) {
        this.newPage();
        if (header && index > 0) {
          drawRow(header, rowHeight(header));
        }
      }
      drawRow(row, height);
    });
    this.y += this.baseSize * 0.8;
  }

  private columns(weights: number[], columns: Block[][], depth: number): void {
    if (columns.length === 0) {
      return;
    }
    const gap = 14;
    const total = weights.reduce((a, b) => a + b, 0) || columns.length;
    const available = this.width - gap * (columns.length - 1);
    this.ensure(this.baseSize * 3);
    const start = this.cursor;
    let end = start;
    const { x, width } = this;
    let cx = x;
    columns.forEach((column, i) => {
      const w = (available * (weights[i] ?? 1)) / total;
      this.cursor = start;
      this.x = cx;
      this.width = w;
      this.blocks(column, depth);
      const here = this.cursor;
      if (here.page > end.page || (here.page === end.page && here.y > end.y)) {
        end = here;
      }
      cx += w + gap;
    });
    this.x = x;
    this.width = width;
    this.cursor = end;
    this.y += this.baseSize * 0.4;
  }

  /** Page numbers and the title, once every page exists. */
  finish(): Uint8Array {
    const pages = this.writer.pages;
    const size = 8.5;
    pages.forEach((page, i) => {
      const y = page.height - this.margin / 2;
      if (this.options.pageNumbers !== false) {
        const label = `${i + 1} / ${pages.length}`;
        page.text(
          (page.width - textWidth(label, 'Helvetica', size)) / 2,
          y,
          label,
          'Helvetica',
          size,
          COLORS.muted,
        );
      }
      if (this.options.title) {
        page.text(
          this.margin,
          y,
          this.options.title,
          'Helvetica',
          size,
          COLORS.muted,
        );
      }
    });
    return this.writer.build();
  }
}

/**
 * The document model as PDF bytes, synchronously, with the pictures given.
 */
export function documentToPdf(
  document: DocumentModel,
  pictures: PdfPictures = new Map(),
  options: PdfDocumentOptions = {},
): Uint8Array {
  const layout = new PdfLayout(
    { ...options, title: options.title ?? document.title ?? undefined },
    pictures,
  );
  layout.blocks(document.blocks);
  return layout.finish();
}

/** The editor's document as a PDF. */
export async function exportLexicalToPdf(
  editor: LexicalEditor,
  options: PdfDocumentOptions = {},
): Promise<Uint8Array> {
  const document = readDocument(editor);
  const pictures = await collectPictures(document, editor, options);
  return documentToPdf(document, pictures, options);
}
