/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * PDF through the browser's print pipeline.
 *
 * The editor's rendered DOM is cloned — canvases replaced by pictures of
 * themselves, editing attributes removed — into a hidden iframe that
 * carries the page's stylesheets, its theme markers forced light, and a
 * print stylesheet; then the iframe prints. The browser lays it out, so
 * everything the editor shows comes through: tables, columns, KaTeX, code
 * highlighting, images, cell outputs, drawings. The reader chooses
 * "Save as PDF" in the dialog; this route gives no file of its own. It is
 * what JupyterLab does to print a notebook.
 *
 * @module convert/pdf/PrintToPdf
 */

import type { LexicalEditor } from 'lexical';

export interface PrintToPdfOptions {
  /** The document title, shown in the print dialog and used as file name. */
  title?: string;
  /** Extra CSS appended after the print stylesheet. */
  css?: string;
  /** `@page` size; `A4` by default. */
  pageSize?: string;
  /** `@page` margin; `18mm` by default. */
  margin?: string;
  /**
   * What prints; `window.print()` by default. Tests pass their own, and a
   * host can preview instead (the iframe is handed over as well).
   */
  print?: (window: Window, iframe: HTMLIFrameElement) => void | Promise<void>;
  /** How long to wait for fonts and images before printing, in ms. */
  timeoutMs?: number;
}

/** The print stylesheet: the document alone, on paper, in light colours. */
export const PRINT_CSS = `
html, body { background: #fff !important; color: #1f2328; margin: 0; padding: 0; }
body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.jupyter-lexical-print { max-width: none !important; margin: 0 !important; }
.jupyter-lexical-print .editor-shell, .jupyter-lexical-print .editor-container,
.jupyter-lexical-print .editor-inner, .jupyter-lexical-print .editor-input,
.jupyter-lexical-print .editor-scroller {
  max-width: none !important; width: auto !important; height: auto !important; min-height: 0 !important;
  margin: 0 !important; padding: 0 !important; border: none !important; box-shadow: none !important;
  overflow: visible !important; resize: none !important;
}
.jupyter-lexical-print [contenteditable] { outline: none !important; }
.jupyter-lexical-print .editor-placeholder, .jupyter-lexical-print .cell-sidebar,
.jupyter-lexical-print .jp-Cell-sidebar, .jupyter-lexical-print .draggable-block-menu,
.jupyter-lexical-print .table-cell-action-button-container, .jupyter-lexical-print [data-print-hide],
.jupyter-lexical-print .jp-Toolbar, .jupyter-lexical-print .lexical-comments-panel,
.jupyter-lexical-print button { display: none !important; }
.jupyter-lexical-print h1, .jupyter-lexical-print h2, .jupyter-lexical-print h3,
.jupyter-lexical-print h4 { break-after: avoid; page-break-after: avoid; }
.jupyter-lexical-print pre, .jupyter-lexical-print table, .jupyter-lexical-print img,
.jupyter-lexical-print figure, .jupyter-lexical-print .jupyter-input, .jupyter-lexical-print .jupyter-output,
.jupyter-lexical-print .Collapsible__container, .jupyter-lexical-print .katex-display,
.jupyter-lexical-print li { break-inside: avoid; page-break-inside: avoid; }
.jupyter-lexical-print tr { break-inside: avoid; page-break-inside: avoid; }
.jupyter-lexical-print a { color: #0969da; text-decoration: underline; }
.jupyter-lexical-print img, .jupyter-lexical-print canvas { max-width: 100% !important; height: auto; }
.jupyter-lexical-print .Collapsible__content { display: block !important; }
`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** The page's stylesheets, as tags for another document. */
function stylesheetTags(doc: Document): string {
  const tags: string[] = [];
  doc.querySelectorAll('link[rel~="stylesheet"], style').forEach(node => {
    if (node instanceof HTMLLinkElement) {
      if (node.href) {
        tags.push(`<link rel="stylesheet" href="${escapeHtml(node.href)}">`);
      }
    } else {
      tags.push(`<style>${node.textContent ?? ''}</style>`);
    }
  });
  return tags.join('\n');
}

/**
 * The classes and data attributes of `element`'s ancestors, so that CSS
 * scoped to a theme container still applies to the clone. Colour-mode
 * markers are forced light: paper is white.
 */
function ancestorContext(element: HTMLElement): {
  classes: string;
  attributes: string;
} {
  const classes = new Set<string>();
  const attributes = new Map<string, string>();
  let node: HTMLElement | null = element.parentElement;
  while (node) {
    node.classList.forEach(cls => {
      if (!/dark/i.test(cls)) {
        classes.add(cls);
      }
    });
    for (const attribute of Array.from(node.attributes)) {
      if (
        attribute.name.startsWith('data-') &&
        !attributes.has(attribute.name)
      ) {
        attributes.set(attribute.name, attribute.value);
      }
    }
    node = node.parentElement;
  }
  attributes.set('data-color-mode', 'light');
  attributes.set(
    'data-light-theme',
    attributes.get('data-light-theme') ?? 'light',
  );
  attributes.set('data-jp-theme-light', 'true');
  attributes.set('data-jp-theme-name', 'JupyterLab Light');
  return {
    classes: Array.from(classes).join(' '),
    attributes: Array.from(attributes)
      .map(([name, value]) => `${name}="${escapeHtml(value)}"`)
      .join(' '),
  };
}

/**
 * A copy of the editor's DOM fit for printing: canvases become images of
 * their pixels, editing attributes go.
 */
export function cloneEditorDom(root: HTMLElement): HTMLElement {
  const clone = root.cloneNode(true) as HTMLElement;
  const canvases = Array.from(root.querySelectorAll('canvas'));
  const cloned = Array.from(clone.querySelectorAll('canvas'));
  canvases.forEach((canvas, i) => {
    const target = cloned[i];
    if (!target) {
      return;
    }
    try {
      const image = clone.ownerDocument.createElement('img');
      image.src = canvas.toDataURL('image/png');
      image.width = canvas.clientWidth || canvas.width;
      image.height = canvas.clientHeight || canvas.height;
      target.replaceWith(image);
    } catch {
      // A tainted canvas stays as it is: blank on paper.
    }
  });
  clone.querySelectorAll('[contenteditable]').forEach(node => {
    node.removeAttribute('contenteditable');
    node.removeAttribute('spellcheck');
  });
  clone.removeAttribute('contenteditable');
  clone.removeAttribute('spellcheck');
  clone.removeAttribute('style');
  return clone;
}

/** The complete HTML document that prints. */
export function buildPrintHtml(
  editor: LexicalEditor,
  options: PrintToPdfOptions = {},
): string {
  const root = editor.getRootElement();
  if (!root) {
    throw new Error('The editor has no root element to print.');
  }
  const clone = cloneEditorDom(root);
  const context = ancestorContext(root);
  const title = options.title ?? document.title ?? 'Document';
  return `<!doctype html>
<html lang="${document.documentElement.lang || 'en'}" class="${escapeHtml(context.classes)}" ${context.attributes}>
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<base href="${escapeHtml(document.baseURI)}">
${stylesheetTags(document)}
<style>
@page { size: ${options.pageSize ?? 'A4'}; margin: ${options.margin ?? '18mm'}; }
${PRINT_CSS}
${options.css ?? ''}
</style>
</head>
<body class="${escapeHtml(context.classes)}" ${context.attributes}>
<div class="jupyter-lexical-print ${escapeHtml(context.classes)}" ${context.attributes}>${clone.outerHTML}</div>
</body>
</html>`;
}

function whenLoaded(doc: Document, timeoutMs: number): Promise<void> {
  const images = Array.from(doc.images).filter(image => !image.complete);
  const waits: Promise<unknown>[] = images.map(
    image =>
      new Promise(resolve => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
      }),
  );
  const fonts = (doc as Document & { fonts?: { ready: Promise<unknown> } })
    .fonts;
  if (fonts?.ready) {
    waits.push(fonts.ready.catch(() => undefined));
  }
  const timeout = new Promise(resolve => setTimeout(resolve, timeoutMs));
  return Promise.race([Promise.all(waits), timeout]).then(() => undefined);
}

/**
 * Print the editor's document: a hidden iframe with the printable copy is
 * printed and removed. Resolves once printing was requested.
 */
export async function printEditorToPdf(
  editor: LexicalEditor,
  options: PrintToPdfOptions = {},
): Promise<void> {
  const html = buildPrintHtml(editor, options);
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.title = options.title ?? 'Print';
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none';
  document.body.appendChild(iframe);
  const win = iframe.contentWindow;
  const doc = iframe.contentDocument;
  if (!win || !doc) {
    iframe.remove();
    throw new Error('The print frame could not be created.');
  }
  doc.open();
  doc.write(html);
  doc.close();
  await whenLoaded(doc, options.timeoutMs ?? 4000);
  const cleanup = () => {
    if (iframe.parentNode) {
      iframe.remove();
    }
  };
  win.addEventListener('afterprint', cleanup, { once: true });
  try {
    if (options.print) {
      await options.print(win, iframe);
    } else {
      win.focus();
      win.print();
    }
  } finally {
    // Chrome returns from print() after the dialog; others fire afterprint.
    setTimeout(cleanup, 60_000);
  }
}
