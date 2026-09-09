/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Lexical → Typst markup.
 *
 * Typst is a typesetting language with LaTeX's ambitions and Markdown's
 * ease: headings are `=`, lists `-` and `+`, and everything else a
 * function — `#table`, `#grid`, `#image`, `#link`. The document model
 * becomes such markup, with pictures (images, drawings, rich outputs) as
 * files beside it and LaTeX equations rendered through the `mitex`
 * package, which the engine fetches from Typst's registry.
 *
 * @module convert/typst/LexicalToTypst
 */

import type { LexicalEditor } from 'lexical';
import * as nbformat from '@jupyterlab/nbformat';
import {
  readDocument,
  type Block,
  type DocumentModel,
  type InlineRun,
  type ListItemModel,
  type TableCellModel,
} from '../pdf/documentModel';
import {
  canRaster,
  canvasElementToRaster,
  canvasToPng,
  dataUrlToBytes,
  elementToRaster,
  imageToRaster,
} from '../pdf/raster';

export interface TypstExportOptions {
  /** `a4` (default) or `us-letter`, or any Typst paper name. */
  paper?: string;
  margin?: string;
  fontSize?: string;
  /** The text font family list; Typst's default serif when empty. */
  font?: string[];
  /** A title block above the document; the first heading names the file. */
  title?: string;
  author?: string;
  /** The date under the title; none when empty. */
  date?: string;
  /**
   * The rendered element of a node, for pictures of drawings and outputs;
   * `editor.getElementByKey` by default.
   */
  resolveElement?: (key: string) => HTMLElement | null;
  /** Whether to load LaTeX math through `mitex` (default) or write it raw. */
  mitex?: boolean;
  /** Page numbers in the footer (default true). */
  pageNumbers?: boolean;
}

export interface TypstDocument {
  /** The Typst source. */
  main: string;
  /** Files the source refers to, by absolute path. */
  files: Map<string, Uint8Array>;
}

/** Text as Typst content: its markup characters escaped. */
export function escapeTypst(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/[*_`#$<>@[\]~]/g, match => `\\${match}`)
    .replace(/\/(?=[/*])/g, '\\/')
    .replace(
      /(^|\n)([=\-+.])/g,
      (_m, before: string, char: string) => `${before}\\${char}`,
    );
}

/** Text as a Typst string literal. */
function typstString(text: string): string {
  return `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
}

/** A raw block whose fence is longer than any run of backticks inside. */
function rawBlock(text: string, language: string | null): string {
  const longest = Math.max(
    2,
    ...(text.match(/`+/g) ?? []).map(run => run.length),
  );
  const fence = '`'.repeat(longest + 1);
  return `${fence}${language ?? ''}\n${text}\n${fence}`;
}

/** A raw string in backticks, the fence longer than any run inside. */
function rawString(text: string): string {
  const longest = Math.max(
    0,
    ...(text.match(/`+/g) ?? []).map(run => run.length),
  );
  const fence = '`'.repeat(longest + 1);
  return `${fence}${text}${fence}`;
}

function inlineMath(equation: string, mitex: boolean): string {
  return mitex
    ? `#mi(${rawString(equation)})`
    : `#raw(${typstString(equation)})`;
}

function displayMath(equation: string, mitex: boolean): string {
  return mitex ? `#mitex(${rawString(equation)})` : rawBlock(equation, 'latex');
}

function joinText(text: string | string[] | undefined): string {
  return Array.isArray(text) ? text.join('') : (text ?? '');
}

const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

class TypstEmitter {
  readonly files = new Map<string, Uint8Array>();
  private pictures = 0;
  private usesMath = false;

  constructor(
    private readonly options: TypstExportOptions,
    private readonly editor: LexicalEditor,
  ) {}

  get mitex(): boolean {
    return this.options.mitex !== false;
  }

  inlines(runs: InlineRun[]): string {
    return runs
      .map(run => {
        if (run.kind === 'break') {
          return ' \\\n';
        }
        if (run.kind === 'equation') {
          this.usesMath = true;
          return inlineMath(run.equation, this.mitex);
        }
        let text = run.code
          ? `#raw(${typstString(run.text)})`
          : escapeTypst(run.text);
        if (run.bold) {
          text = `#strong[${text}]`;
        }
        if (run.italic) {
          text = `#emph[${text}]`;
        }
        if (run.underline) {
          text = `#underline[${text}]`;
        }
        if (run.strikethrough) {
          text = `#strike[${text}]`;
        }
        if (run.highlight) {
          text = `#highlight[${text}]`;
        }
        if (run.superscript) {
          text = `#super[${text}]`;
        }
        if (run.subscript) {
          text = `#sub[${text}]`;
        }
        if (run.link) {
          text = `#link(${typstString(run.link)})[${text}]`;
        }
        return text;
      })
      .join('');
  }

  private picture(bytes: Uint8Array, extension: string): string {
    this.pictures += 1;
    const path = `/picture-${this.pictures}.${extension}`;
    this.files.set(path, bytes);
    return path;
  }

  /** The element a node renders to, if it is on screen. */
  private element(key: string): HTMLElement | null {
    return this.options.resolveElement
      ? this.options.resolveElement(key)
      : this.editor.getElementByKey(key);
  }

  private async pictureOfElement(key: string): Promise<string | null> {
    const element = this.element(key);
    if (!element || !canRaster()) {
      return null;
    }
    const canvas = element.querySelector('canvas');
    const raster =
      (canvas && canvasElementToRaster(canvas)) ??
      (await elementToRaster(element, 2));
    if (!raster) {
      return null;
    }
    return this.picture(await canvasToPng(raster.canvas), 'png');
  }

  private async pictureOfImage(src: string): Promise<string | null> {
    if (src.startsWith('data:')) {
      const type = /^data:image\/(png|jpe?g|gif|svg\+xml)/i.exec(src)?.[1];
      if (type) {
        return this.picture(
          dataUrlToBytes(src),
          type === 'svg+xml' ? 'svg' : type.replace('jpeg', 'jpg'),
        );
      }
    }
    try {
      const response = await fetch(src, { mode: 'cors' });
      if (response.ok) {
        const type = response.headers.get('content-type') ?? '';
        const extension = /png/.test(type)
          ? 'png'
          : /jpe?g/.test(type)
            ? 'jpg'
            : /gif/.test(type)
              ? 'gif'
              : /svg/.test(type)
                ? 'svg'
                : null;
        if (extension) {
          return this.picture(
            new Uint8Array(await response.arrayBuffer()),
            extension,
          );
        }
      }
    } catch {
      // Not fetchable as bytes: draw it instead.
    }
    const raster = await imageToRaster(src);
    return raster
      ? this.picture(await canvasToPng(raster.canvas), 'png')
      : null;
  }

  async block(block: Block, depth = 0): Promise<string> {
    switch (block.kind) {
      case 'heading': {
        const heading = `${'='.repeat(block.level)} ${this.inlines(block.inlines)}`;
        return block.align === 'center'
          ? `#align(center)[${heading}]`
          : heading;
      }
      case 'paragraph': {
        const text = this.inlines(block.inlines);
        if (!text.trim()) {
          return '';
        }
        const indented =
          block.indent > 0
            ? `#pad(left: ${block.indent * 1.5}em)[${text}]`
            : text;
        return block.align === 'center' || block.align === 'right'
          ? `#align(${block.align})[${indented}]`
          : indented;
      }
      case 'quote':
        return `#quote(block: true)[\n${await this.blocks(block.blocks, depth)}\n]`;
      case 'list':
        return this.list(block.ordered, block.start, block.items, depth);
      case 'code':
        return rawBlock(block.text, block.language);
      case 'outputs':
        return this.outputs(block.outputs, block.key);
      case 'table':
        return this.table(block.rows);
      case 'columns': {
        const total = block.weights.reduce((a, b) => a + b, 0) || 1;
        const columns = block.weights
          .map(w => `${Math.round((w / total) * 1000) / 10}fr`)
          .join(', ');
        const cells: string[] = [];
        for (const column of block.columns) {
          cells.push(`[\n${await this.blocks(column, depth)}\n]`);
        }
        return `#grid(columns: (${columns}), gutter: 1.2em, ${cells.join(', ')})`;
      }
      case 'rule':
        return '#line(length: 100%, stroke: 0.5pt + luma(180))';
      case 'image': {
        const path = await this.pictureOfImage(block.src);
        if (!path) {
          return `#emph[${escapeTypst(block.alt || 'Image')}]`;
        }
        return block.alt
          ? `#figure(image(${typstString(path)}, width: 80%), caption: [${escapeTypst(block.alt)}])`
          : `#image(${typstString(path)}, width: 80%)`;
      }
      case 'equation':
        this.usesMath = true;
        return displayMath(block.equation, this.mitex);
      case 'collapsible': {
        const title = this.inlines(block.title);
        const body = await this.blocks(block.blocks, depth);
        return `#block(width: 100%, inset: 10pt, radius: 4pt, stroke: 0.5pt + luma(200))[\n#strong[${title}]\n\n${body}\n]`;
      }
      case 'embed':
        return `#link(${typstString(block.url)})[${escapeTypst(block.label)}]`;
      case 'drawing': {
        const path = await this.pictureOfElement(block.key);
        return path
          ? `#image(${typstString(path)}, width: 80%)`
          : `#emph[${escapeTypst(block.label)}]`;
      }
      default:
        return '';
    }
  }

  async blocks(blocks: Block[], depth = 0): Promise<string> {
    const parts: string[] = [];
    for (const block of blocks) {
      const text = await this.block(block, depth);
      if (text) {
        parts.push(text);
      }
    }
    return parts.join('\n\n');
  }

  private async list(
    ordered: boolean,
    start: number,
    items: ListItemModel[],
    depth: number,
  ): Promise<string> {
    const indent = '  '.repeat(depth);
    const lines: string[] = [];
    for (const [i, item] of items.entries()) {
      let marker = ordered ? `${start + i}.` : '-';
      if (item.checked !== null) {
        marker = item.checked
          ? '- #box(width: 0.75em, height: 0.75em, stroke: 0.5pt, fill: luma(80))'
          : '- #box(width: 0.75em, height: 0.75em, stroke: 0.5pt)';
      }
      const [first, ...rest] = item.blocks;
      const firstText = first
        ? first.kind === 'paragraph'
          ? this.inlines(first.inlines)
          : await this.block(first, depth + 1)
        : '';
      lines.push(`${indent}${marker} ${firstText}`);
      for (const block of rest) {
        const text = await this.block(block, depth + 1);
        if (block.kind === 'list') {
          lines.push(text);
        } else if (text) {
          lines.push(`${indent}  ${text.replace(/\n/g, `\n${indent}  `)}`);
        }
      }
    }
    return lines.join('\n');
  }

  private table(rows: TableCellModel[][]): string {
    const columns = Math.max(
      1,
      ...rows.map(row => row.reduce((n, cell) => n + cell.colSpan, 0)),
    );
    const cells: string[] = [];
    const headerRows =
      rows.length && rows[0].every(cell => cell.header) ? 1 : 0;
    rows.forEach((row, r) => {
      const rendered = row.map(cell => {
        const content = this.inlines(cell.inlines);
        const body = cell.header ? `#strong[${content}]` : content;
        return cell.colSpan > 1
          ? `table.cell(colspan: ${cell.colSpan})[${body}]`
          : `[${body}]`;
      });
      if (r < headerRows) {
        cells.push(`table.header(${rendered.join(', ')})`);
      } else {
        cells.push(...rendered);
      }
    });
    return `#table(columns: ${columns}, stroke: 0.5pt + luma(200), inset: 6pt, ${cells.join(', ')})`;
  }

  private async outputs(
    outputs: nbformat.IOutput[],
    key: string,
  ): Promise<string> {
    const parts: string[] = [];
    for (const output of outputs) {
      if (nbformat.isStream(output)) {
        parts.push(rawBlock(joinText(output.text).replace(/\s+$/, ''), null));
      } else if (nbformat.isError(output)) {
        parts.push(
          rawBlock(output.traceback.join('\n').replace(ANSI, ''), null),
        );
      } else if (
        nbformat.isDisplayData(output) ||
        nbformat.isExecuteResult(output)
      ) {
        const data = output.data;
        const png = data['image/png'];
        const jpeg = data['image/jpeg'];
        const svg = data['image/svg+xml'];
        if (typeof png === 'string') {
          const path = this.picture(
            dataUrlToBytes(`data:image/png;base64,${png.replace(/\s/g, '')}`),
            'png',
          );
          parts.push(`#image(${typstString(path)}, width: 80%)`);
        } else if (typeof jpeg === 'string') {
          const path = this.picture(
            dataUrlToBytes(`data:image/jpeg;base64,${jpeg.replace(/\s/g, '')}`),
            'jpg',
          );
          parts.push(`#image(${typstString(path)}, width: 80%)`);
        } else if (svg !== undefined) {
          const path = this.picture(
            new TextEncoder().encode(joinText(svg as string | string[])),
            'svg',
          );
          parts.push(`#image(${typstString(path)}, width: 80%)`);
        } else if (typeof data['text/latex'] === 'string') {
          this.usesMath = true;
          parts.push(
            displayMath(
              String(data['text/latex']).replace(/^\$+|\$+$/g, ''),
              this.mitex,
            ),
          );
        } else if (data['text/html'] !== undefined) {
          const path = await this.pictureOfElement(key);
          parts.push(
            path
              ? `#image(${typstString(path)}, width: 100%)`
              : rawBlock(
                  joinText(data['text/plain'] as string | string[] | undefined),
                  null,
                ),
          );
        } else if (data['text/plain'] !== undefined) {
          parts.push(
            rawBlock(joinText(data['text/plain'] as string | string[]), null),
          );
        }
      }
    }
    return parts.join('\n\n');
  }

  preamble(document: DocumentModel): string {
    const options = this.options;
    const font = options.font?.length
      ? `, font: (${options.font.map(typstString).join(', ')})`
      : '';
    const numbering =
      options.pageNumbers === false ? '' : ', numbering: "1 / 1"';
    const lines = [
      `#set page(paper: ${typstString(options.paper ?? 'a4')}, margin: ${options.margin ?? '2cm'}${numbering})`,
      `#set text(size: ${options.fontSize ?? '11pt'}${font})`,
      '#set par(justify: true)',
      '#set heading(numbering: none)',
      '#show link: set text(fill: rgb("#0969da"))',
      '#show raw.where(block: true): block.with(fill: luma(246), inset: 8pt, radius: 4pt, width: 100%)',
      '#show heading.where(level: 1): set text(size: 1.7em)',
      '#show heading.where(level: 2): set text(size: 1.35em)',
    ];
    if (this.usesMath && this.mitex) {
      lines.push('#import "@preview/mitex:0.2.5": mi, mitex');
    }
    const title = options.title ?? document.title;
    if (options.title) {
      const meta = [`title: ${typstString(options.title)}`];
      if (options.author) {
        meta.push(`author: ${typstString(options.author)}`);
      }
      lines.push(`#set document(${meta.join(', ')})`);
      lines.push(
        `#align(center)[#text(size: 2em, weight: "bold")[${escapeTypst(options.title)}]]`,
      );
      if (options.author) {
        lines.push(`#align(center)[#emph[${escapeTypst(options.author)}]]`);
      }
      if (options.date) {
        lines.push(`#align(center)[${escapeTypst(options.date)}]`);
      }
      lines.push('#v(1em)');
    } else if (title) {
      lines.push(`#set document(title: ${typstString(title)})`);
    }
    return lines.join('\n');
  }
}

/**
 * The document as Typst: its markup, and the pictures it refers to. Async
 * because pictures are drawn or fetched; the editor is read synchronously
 * at the start.
 */
export async function lexicalToTypst(
  editor: LexicalEditor,
  options: TypstExportOptions = {},
): Promise<TypstDocument> {
  const document = readDocument(editor);
  const emitter = new TypstEmitter(options, editor);
  const body = await emitter.blocks(document.blocks);
  return {
    main: `${emitter.preamble(document)}\n\n${body}\n`,
    files: emitter.files,
  };
}
