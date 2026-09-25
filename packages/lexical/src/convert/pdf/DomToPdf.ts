/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * PDF by picture: the editor as shown on screen is drawn to a canvas with
 * html2canvas, cut into page-sized strips at the whitest row near each cut,
 * and each strip becomes a page image. Nothing is missed and nothing is
 * text: the file is not searchable and is only as sharp as the raster.
 *
 * @module convert/pdf/DomToPdf
 */

import type { LexicalEditor } from 'lexical';
import { PAGE_SIZES, PdfWriter, type PdfPageSize } from './PdfWriter';
import { canvasToJpeg, elementToRaster } from './raster';

export interface SnapshotToPdfOptions {
  size?: 'a4' | 'letter' | PdfPageSize;
  /** Page margin in points; 36 (half an inch) by default. */
  margin?: number;
  /** Device pixels per CSS pixel; 2 by default. */
  scale?: number;
  /** JPEG quality, 0–1. */
  quality?: number;
  title?: string;
  author?: string;
}

function pageSize(size: SnapshotToPdfOptions['size']): PdfPageSize {
  if (!size) {
    return PAGE_SIZES.a4;
  }
  return typeof size === 'string' ? PAGE_SIZES[size] : size;
}

/**
 * The row at or above `wanted` (within `window` rows) that is closest to
 * white, so a cut does not go through a line of text.
 */
function whitestRowNear(
  ctx: CanvasRenderingContext2D,
  width: number,
  wanted: number,
  window: number,
): number {
  const from = Math.max(1, wanted - window);
  const data = ctx.getImageData(0, from, width, wanted - from).data;
  let best = wanted;
  let bestInk = Infinity;
  for (let row = wanted - 1; row >= from; row--) {
    let ink = 0;
    const offset = (row - from) * width * 4;
    for (let x = 0; x < width * 4; x += 16) {
      const i = offset + x;
      ink += 765 - (data[i] + data[i + 1] + data[i + 2]);
    }
    if (ink === 0) {
      return row;
    }
    if (ink < bestInk) {
      bestInk = ink;
      best = row;
    }
  }
  return best;
}

/**
 * The editor's rendered document as a PDF of page images. The element
 * drawn is the editor root (`editor.getRootElement()`), or `element`.
 */
export async function snapshotEditorToPdf(
  editor: LexicalEditor,
  options: SnapshotToPdfOptions = {},
  element?: HTMLElement,
): Promise<Uint8Array> {
  const root = element ?? editor.getRootElement();
  if (!root) {
    throw new Error('The editor has no root element to draw.');
  }
  const scale = options.scale ?? 2;
  const raster = await elementToRaster(root, scale);
  if (!raster) {
    throw new Error('The document could not be drawn to a canvas.');
  }
  const size = pageSize(options.size);
  const margin = options.margin ?? 36;
  const writer = new PdfWriter({
    size,
    title: options.title,
    author: options.author,
  });
  const { canvas } = raster;
  const ctx = canvas.getContext('2d');
  const contentWidth = size.width - 2 * margin;
  const contentHeight = size.height - 2 * margin;
  const pointsPerPixel = contentWidth / canvas.width;
  const stripHeight = Math.floor(contentHeight / pointsPerPixel);
  let top = 0;
  while (top < canvas.height) {
    let bottom = Math.min(canvas.height, top + stripHeight);
    if (bottom < canvas.height && ctx) {
      bottom = Math.max(
        top + Math.floor(stripHeight / 2),
        whitestRowNear(ctx, canvas.width, bottom, Math.floor(60 * scale)),
      );
    }
    const strip = document.createElement('canvas');
    strip.width = canvas.width;
    strip.height = bottom - top;
    strip
      .getContext('2d')
      ?.drawImage(
        canvas,
        0,
        top,
        canvas.width,
        strip.height,
        0,
        0,
        canvas.width,
        strip.height,
      );
    const jpeg = await canvasToJpeg(strip, options.quality ?? 0.9);
    const image = writer.addJpeg(jpeg, strip.width, strip.height);
    const page = writer.addPage();
    page.image(
      image,
      margin,
      margin,
      contentWidth,
      strip.height * pointsPerPixel,
    );
    top = bottom;
  }
  if (writer.pages.length === 0) {
    writer.addPage();
  }
  return writer.build();
}
