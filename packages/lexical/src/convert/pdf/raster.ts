/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * What the browser can draw for us: an element, an image, an equation, an
 * SVG — as a canvas, and from there as JPEG or PNG bytes for a PDF. Every
 * function returns `null` where it cannot run (no DOM, a tainted canvas),
 * so exporters fall back to a placeholder instead of failing.
 *
 * @module convert/pdf/raster
 */

import katex from 'katex';

export interface Raster {
  canvas: HTMLCanvasElement;
  /** The size in CSS pixels the drawing had on screen. */
  cssWidth: number;
  cssHeight: number;
  /**
   * For an equation: how far, in CSS pixels, the picture hangs below the
   * text baseline, so it can be set on the line like a glyph.
   */
  depth?: number;
}

/** Whether a real canvas is available (not under jsdom). */
export function canRaster(): boolean {
  if (
    typeof document === 'undefined' ||
    typeof HTMLCanvasElement === 'undefined'
  ) {
    return false;
  }
  if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) {
    return false;
  }
  return true;
}

/** The bytes of a `data:` URL. */
export function dataUrlToBytes(url: string): Uint8Array {
  const comma = url.indexOf(',');
  const meta = url.slice(0, comma);
  const data = url.slice(comma + 1);
  if (/;base64/i.test(meta)) {
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return new TextEncoder().encode(decodeURIComponent(data));
}

async function canvasToBytes(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>(resolve =>
    canvas.toBlob(resolve, type, quality),
  );
  if (blob) {
    return new Uint8Array(await blob.arrayBuffer());
  }
  return dataUrlToBytes(canvas.toDataURL(type, quality));
}

/** JPEG bytes of a canvas; transparency is flattened on white. */
export async function canvasToJpeg(
  canvas: HTMLCanvasElement,
  quality = 0.92,
): Promise<Uint8Array> {
  const flat = document.createElement('canvas');
  flat.width = canvas.width;
  flat.height = canvas.height;
  const ctx = flat.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, flat.width, flat.height);
    ctx.drawImage(canvas, 0, 0);
  }
  return canvasToBytes(ctx ? flat : canvas, 'image/jpeg', quality);
}

export function canvasToPng(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return canvasToBytes(canvas, 'image/png');
}

/**
 * A copy of `canvas`' pixels at the size `width × height`; a canvas that
 * came from html2canvas is often huge and a page image need not be.
 */
export function scaleCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(width));
  out.height = Math.max(1, Math.round(height));
  out.getContext('2d')?.drawImage(canvas, 0, 0, out.width, out.height);
  return out;
}

type Html2Canvas = (
  element: HTMLElement,
  options?: Record<string, unknown>,
) => Promise<HTMLCanvasElement>;

let html2canvasModule: Promise<Html2Canvas> | null = null;

/** `html2canvas`, loaded when first needed so it stays out of the bundle. */
export function loadHtml2Canvas(): Promise<Html2Canvas> {
  if (!html2canvasModule) {
    html2canvasModule = import('html2canvas').then(
      module => (module.default ?? module) as unknown as Html2Canvas,
    );
  }
  return html2canvasModule;
}

/** An element as it is on screen, drawn at `scale` device pixels per CSS pixel. */
export async function elementToRaster(
  element: HTMLElement,
  scale = 2,
): Promise<Raster | null> {
  if (!canRaster()) {
    return null;
  }
  try {
    const html2canvas = await loadHtml2Canvas();
    const rect = element.getBoundingClientRect();
    const canvas = await html2canvas(element, {
      scale,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });
    return {
      canvas,
      cssWidth: rect.width || canvas.width / scale,
      cssHeight: rect.height || canvas.height / scale,
    };
  } catch {
    return null;
  }
}

/** A canvas already on screen (a drawing, a chart), copied. */
export function canvasElementToRaster(
  canvas: HTMLCanvasElement,
): Raster | null {
  if (!canRaster() || canvas.width === 0 || canvas.height === 0) {
    return null;
  }
  try {
    const copy = scaleCanvas(canvas, canvas.width, canvas.height);
    // A tainted canvas throws here, not at drawImage.
    copy.toDataURL();
    const rect = canvas.getBoundingClientRect();
    return {
      canvas: copy,
      cssWidth: rect.width || canvas.width,
      cssHeight: rect.height || canvas.height,
    };
  } catch {
    return null;
  }
}

/**
 * The first inline `<svg>` of `element` as a standalone document, its size
 * taken from the element on screen (or the viewBox) when it is relative —
 * drawings render that way, and an SVG needs a size to be an image.
 */
export function inlineSvgOf(element: HTMLElement): string | null {
  const svg = element.querySelector('svg');
  if (!svg) {
    return null;
  }
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const rect = svg.getBoundingClientRect();
  const viewBox = (svg.getAttribute('viewBox') ?? '')
    .split(/[\s,]+/)
    .map(Number);
  const relative = (value: string | null) => !value || /%$/.test(value);
  if (
    relative(svg.getAttribute('width')) ||
    relative(svg.getAttribute('height'))
  ) {
    const width = rect.width || (viewBox.length === 4 ? viewBox[2] : 300);
    const height = rect.height || (viewBox.length === 4 ? viewBox[3] : 150);
    clone.setAttribute('width', String(Math.round(width)));
    clone.setAttribute('height', String(Math.round(height)));
  }
  return new XMLSerializer().serializeToString(clone);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (!src.startsWith('data:')) {
      image.crossOrigin = 'anonymous';
    }
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error(`Image failed to load: ${src.slice(0, 80)}`));
    image.src = src;
  });
}

/**
 * An image by URL, drawn to a canvas. Cross-origin images without CORS
 * headers cannot be read back and give `null`.
 */
export async function imageToRaster(
  src: string,
  maxPixels = 4_000_000,
): Promise<Raster | null> {
  if (!canRaster()) {
    return null;
  }
  try {
    const image = await loadImage(src);
    let width = image.naturalWidth || image.width;
    let height = image.naturalHeight || image.height;
    if (!width || !height) {
      return null;
    }
    const cssWidth = width;
    const cssHeight = height;
    const factor = Math.sqrt(maxPixels / (width * height));
    if (factor < 1) {
      width = Math.round(width * factor);
      height = Math.round(height * factor);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')?.drawImage(image, 0, 0, width, height);
    canvas.toDataURL();
    return { canvas, cssWidth, cssHeight };
  } catch {
    return null;
  }
}

/** The `width`/`height` attributes of an SVG root, in CSS pixels. */
function svgSize(svg: string): { width: number; height: number } | null {
  const root = /<svg\b[^>]*>/.exec(svg)?.[0];
  if (!root) {
    return null;
  }
  const read = (name: string) => {
    const value = new RegExp(`\\s${name}="([\\d.]+)(px)?"`).exec(root)?.[1];
    return value ? Number(value) : NaN;
  };
  const width = read('width');
  const height = read('height');
  return Number.isFinite(width) &&
    Number.isFinite(height) &&
    width > 0 &&
    height > 0
    ? { width, height }
    : null;
}

/**
 * An SVG document as a raster at `scale` device pixels per CSS pixel. The
 * root must carry a size in pixels (see `inlineSvgOf`, `mathToSvg`).
 */
export async function svgToRaster(
  svg: string,
  scale = 2,
): Promise<Raster | null> {
  const size = svgSize(svg);
  const scaled = size
    ? svg.replace(/<svg\b[^>]*>/, root =>
        root
          .replace(/\swidth="[^"]*"/, ` width="${size.width * scale}"`)
          .replace(/\sheight="[^"]*"/, ` height="${size.height * scale}"`),
      )
    : svg;
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(scaled)}`;
  const raster = await imageToRaster(url, 16_000_000);
  if (raster && size) {
    raster.cssWidth = size.width;
    raster.cssHeight = size.height;
  }
  return raster;
}

/** TeX typeset by MathJax as SVG, with its size and baseline in CSS pixels. */
export interface MathSvg {
  svg: string;
  width: number;
  height: number;
  /** How far the picture hangs below the baseline. */
  depth: number;
}

type MathJaxConverter = (
  tex: string,
  display: boolean,
) => {
  svg: string;
  widthEx: number;
  heightEx: number;
  depthEx: number;
};

let mathJaxConverter: Promise<MathJaxConverter> | null = null;

/** MathJax's TeX → SVG pipeline, loaded on first use (it is large). */
function loadMathJax(): Promise<MathJaxConverter> {
  if (!mathJaxConverter) {
    mathJaxConverter = (async () => {
      const [
        { mathjax },
        { TeX },
        { SVG },
        { liteAdaptor },
        { RegisterHTMLHandler },
        { AllPackages },
      ] = await Promise.all([
        import('mathjax-full/js/mathjax.js'),
        import('mathjax-full/js/input/tex.js'),
        import('mathjax-full/js/output/svg.js'),
        import('mathjax-full/js/adaptors/liteAdaptor.js'),
        import('mathjax-full/js/handlers/html.js'),
        import('mathjax-full/js/input/tex/AllPackages.js'),
      ]);
      const adaptor = liteAdaptor();
      RegisterHTMLHandler(adaptor);
      const document = mathjax.document('', {
        InputJax: new TeX({ packages: AllPackages }),
        OutputJax: new SVG({ fontCache: 'local' }),
      });
      return (tex: string, display: boolean) => {
        const node = document.convert(tex, { display });
        const svg = adaptor.innerHTML(node);
        const root = /<svg\b[^>]*>/.exec(svg)?.[0] ?? '';
        const ex = (name: string) =>
          Number(new RegExp(`${name}="(-?[\\d.]+)ex"`).exec(root)?.[1] ?? 0);
        const align = /vertical-align:\s*(-?[\d.]+)ex/.exec(root)?.[1];
        return {
          svg,
          widthEx: ex('width'),
          heightEx: ex('height'),
          depthEx: align ? -Number(align) : 0,
        };
      };
    })();
    mathJaxConverter.catch(() => {
      mathJaxConverter = null;
    });
  }
  return mathJaxConverter;
}

/**
 * `tex` as an SVG sized for text of `fontSizePx`, or `null` when MathJax
 * cannot be loaded. Works without a DOM, so a server can use it too.
 */
export async function mathToSvg(
  tex: string,
  display: boolean,
  fontSizePx = 16,
): Promise<MathSvg | null> {
  try {
    const convert = await loadMathJax();
    const { svg, widthEx, heightEx, depthEx } = convert(tex, display);
    // MathJax measures in ex; its fonts put 1ex at about 0.43em.
    const exPx = fontSizePx * 0.43;
    const width = Math.max(1, Math.ceil(widthEx * exPx));
    const height = Math.max(1, Math.ceil(heightEx * exPx));
    const sized = svg.replace(/<svg\b[^>]*>/, root =>
      root
        .replace(/\swidth="[^"]*"/, ` width="${width}"`)
        .replace(/\sheight="[^"]*"/, ` height="${height}"`),
    );
    return { svg: sized, width, height, depth: Math.max(0, depthEx * exPx) };
  } catch {
    return null;
  }
}

/**
 * An equation as a picture at `scale` device pixels per CSS pixel: typeset
 * by MathJax as SVG when it loads, else by KaTeX off screen and drawn.
 */
export async function equationToRaster(
  equation: string,
  inline: boolean,
  scale = 3,
  fontSizePx = 16,
): Promise<Raster | null> {
  if (!canRaster()) {
    return null;
  }
  // MathJax first: vector glyphs, a known baseline, no layout quirks.
  const math = await mathToSvg(equation, !inline, fontSizePx);
  if (math) {
    const raster = await svgToRaster(math.svg, scale);
    if (raster) {
      raster.depth = math.depth;
      return raster;
    }
  }
  // Else KaTeX on an off-screen element, drawn by html2canvas.
  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-10000px;top:0;padding:2px 4px;font-size:${fontSizePx}px;color:#000;background:#fff;display:inline-block;white-space:nowrap`;
  document.body.appendChild(host);
  try {
    katex.render(equation, host, {
      displayMode: !inline,
      throwOnError: false,
      output: 'html',
      strict: 'ignore',
    });
    return await elementToRaster(host, scale);
  } catch {
    return null;
  } finally {
    host.remove();
  }
}

/** Hand the browser a file. */
export function downloadBytes(
  filename: string,
  bytes: Uint8Array,
  mime = 'application/pdf',
): void {
  const url = bytesToObjectUrl(bytes, mime);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function bytesToObjectUrl(
  bytes: Uint8Array,
  mime = 'application/pdf',
): string {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return URL.createObjectURL(new Blob([copy.buffer], { type: mime }));
}

/** `name.pdf`, from a title. */
export function pdfFilename(
  title: string | undefined,
  fallback = 'document',
): string {
  const base = (title ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base || fallback}.pdf`;
}
