/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Four ways out to PDF, one extension each, and a bundle of the four.
 *
 * - `PdfPrintExtension` — the browser prints the rendered document
 *   (`PRINT_PDF_COMMAND`). Highest fidelity; the reader saves from the
 *   dialog.
 * - `PdfDocumentExtension` — a vector PDF laid out from the document model
 *   with the standard fonts (`EXPORT_PDF_DOCUMENT_COMMAND`). Real text,
 *   small files, no dependency.
 * - `PdfSnapshotExtension` — the rendered document drawn to a canvas and
 *   cut into page images (`EXPORT_PDF_SNAPSHOT_COMMAND`). Everything as it
 *   looks; nothing selectable.
 * - `PdfTypesetExtension` — the document as Typst markup, typeset by the
 *   Typst compiler running in WebAssembly, loaded from a CDN on first use
 *   (`EXPORT_PDF_TYPESET_COMMAND`). Real typesetting, LaTeX math through
 *   `mitex`.
 *
 * Each command's payload names the file and says whether to download it;
 * `onDone` receives the bytes and `onError` any failure. The extensions'
 * outputs offer the same as functions returning promises.
 *
 * @module extensions/PdfExportExtension
 */

import {
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  defineExtension,
  type LexicalCommand,
  type LexicalEditor,
} from 'lexical';
import { downloadBytes, pdfFilename, readDocument } from '../convert/pdf';
import {
  exportLexicalToPdf,
  type PdfDocumentOptions,
} from '../convert/pdf/LexicalToPdf';
import {
  printEditorToPdf,
  type PrintToPdfOptions,
} from '../convert/pdf/PrintToPdf';
import {
  snapshotEditorToPdf,
  type SnapshotToPdfOptions,
} from '../convert/pdf/DomToPdf';
import {
  isTypstEngine,
  lexicalToTypst,
  loadTypstEngine,
  type TypstEngine,
  type TypstEngineOptions,
  type TypstExportOptions,
} from '../convert/typst';

/** What every export command takes, besides its own options. */
export interface PdfExportRequest {
  /** The file name; from the document's first heading by default. */
  filename?: string;
  /** Hand the file to the browser (default true). */
  download?: boolean;
  onDone?: (bytes: Uint8Array) => void;
  onError?: (error: unknown) => void;
}

export type PdfPrintRequest = PrintToPdfOptions &
  Pick<PdfExportRequest, 'onError'> & { onDone?: () => void };
export type PdfDocumentRequest = PdfDocumentOptions & PdfExportRequest;
export type PdfSnapshotRequest = SnapshotToPdfOptions & PdfExportRequest;
export type PdfTypesetRequest = TypstExportOptions & PdfExportRequest;

export const PRINT_PDF_COMMAND: LexicalCommand<PdfPrintRequest | undefined> =
  createCommand('PRINT_PDF_COMMAND');
export const EXPORT_PDF_DOCUMENT_COMMAND: LexicalCommand<
  PdfDocumentRequest | undefined
> = createCommand('EXPORT_PDF_DOCUMENT_COMMAND');
export const EXPORT_PDF_SNAPSHOT_COMMAND: LexicalCommand<
  PdfSnapshotRequest | undefined
> = createCommand('EXPORT_PDF_SNAPSHOT_COMMAND');
export const EXPORT_PDF_TYPESET_COMMAND: LexicalCommand<
  PdfTypesetRequest | undefined
> = createCommand('EXPORT_PDF_TYPESET_COMMAND');

/** The title the document gives itself: its first heading. */
function documentTitle(editor: LexicalEditor): string | undefined {
  return readDocument(editor).title ?? undefined;
}

/** Run an export: download unless told not to, then report. */
function deliver(
  editor: LexicalEditor,
  work: Promise<Uint8Array>,
  request: PdfExportRequest,
  fallback: string,
): Promise<Uint8Array> {
  return work.then(
    bytes => {
      if (request.download !== false) {
        downloadBytes(
          request.filename ?? pdfFilename(documentTitle(editor), fallback),
          bytes,
        );
      }
      request.onDone?.(bytes);
      return bytes;
    },
    error => {
      request.onError?.(error);
      throw error;
    },
  );
}

// ── 1. Print ─────────────────────────────────────────────────────────

export function printPdf(
  editor: LexicalEditor,
  request: PdfPrintRequest = {},
): Promise<void> {
  const { onDone, onError, ...options } = request;
  return printEditorToPdf(editor, {
    title: documentTitle(editor),
    ...options,
  }).then(
    () => onDone?.(),
    error => {
      onError?.(error);
      throw error;
    },
  );
}

export function registerPdfPrint(
  editor: LexicalEditor,
  config: PrintToPdfOptions = {},
): () => void {
  return editor.registerCommand(
    PRINT_PDF_COMMAND,
    payload => {
      printPdf(editor, { ...config, ...payload }).catch(() => undefined);
      return true;
    },
    COMMAND_PRIORITY_EDITOR,
  );
}

export const PdfPrintExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/PdfPrint',
  config: {} as PrintToPdfOptions,
  register: (editor, config) => registerPdfPrint(editor, config),
  build: (editor, config) => ({
    print: (request: PdfPrintRequest = {}) =>
      printPdf(editor, { ...config, ...request }),
  }),
});

// ── 2. Document (vector) ─────────────────────────────────────────────

export function exportPdfDocument(
  editor: LexicalEditor,
  request: PdfDocumentRequest = {},
): Promise<Uint8Array> {
  const { filename, download, onDone, onError, ...options } = request;
  return deliver(
    editor,
    exportLexicalToPdf(editor, options),
    { filename, download, onDone, onError },
    'document',
  );
}

export function registerPdfDocument(
  editor: LexicalEditor,
  config: PdfDocumentOptions = {},
): () => void {
  return editor.registerCommand(
    EXPORT_PDF_DOCUMENT_COMMAND,
    payload => {
      exportPdfDocument(editor, { ...config, ...payload }).catch(
        () => undefined,
      );
      return true;
    },
    COMMAND_PRIORITY_EDITOR,
  );
}

export const PdfDocumentExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/PdfDocument',
  config: {} as PdfDocumentOptions,
  register: (editor, config) => registerPdfDocument(editor, config),
  build: (editor, config) => ({
    export: (request: PdfDocumentRequest = {}) =>
      exportPdfDocument(editor, { ...config, ...request }),
  }),
});

// ── 3. Snapshot (raster) ─────────────────────────────────────────────

export function exportPdfSnapshot(
  editor: LexicalEditor,
  request: PdfSnapshotRequest = {},
): Promise<Uint8Array> {
  const { filename, download, onDone, onError, ...options } = request;
  return deliver(
    editor,
    snapshotEditorToPdf(editor, { title: documentTitle(editor), ...options }),
    { filename, download, onDone, onError },
    'snapshot',
  );
}

export function registerPdfSnapshot(
  editor: LexicalEditor,
  config: SnapshotToPdfOptions = {},
): () => void {
  return editor.registerCommand(
    EXPORT_PDF_SNAPSHOT_COMMAND,
    payload => {
      exportPdfSnapshot(editor, { ...config, ...payload }).catch(
        () => undefined,
      );
      return true;
    },
    COMMAND_PRIORITY_EDITOR,
  );
}

export const PdfSnapshotExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/PdfSnapshot',
  config: {} as SnapshotToPdfOptions,
  register: (editor, config) => registerPdfSnapshot(editor, config),
  build: (editor, config) => ({
    export: (request: PdfSnapshotRequest = {}) =>
      exportPdfSnapshot(editor, { ...config, ...request }),
  }),
});

// ── 4. Typeset (Typst in WebAssembly) ────────────────────────────────

export interface PdfTypesetConfig extends TypstExportOptions {
  /** The engine, or where to load it from; the CDN copy by default. */
  engine?: TypstEngine | TypstEngineOptions;
}

function engineOf(config: PdfTypesetConfig): Promise<TypstEngine> {
  return isTypstEngine(config.engine)
    ? Promise.resolve(config.engine)
    : loadTypstEngine(config.engine);
}

/** The document typeset by Typst: the PDF, and the markup it came from. */
export async function typesetToPdf(
  editor: LexicalEditor,
  config: PdfTypesetConfig = {},
): Promise<{ pdf: Uint8Array; typst: string }> {
  const { engine: _engine, ...options } = config;
  const [engine, document] = await Promise.all([
    engineOf(config),
    lexicalToTypst(editor, options),
  ]);
  const pdf = await engine.compile(document.main, document.files);
  return { pdf, typst: document.main };
}

export function exportPdfTypeset(
  editor: LexicalEditor,
  request: PdfTypesetRequest & { engine?: PdfTypesetConfig['engine'] } = {},
): Promise<Uint8Array> {
  const { filename, download, onDone, onError, ...options } = request;
  return deliver(
    editor,
    typesetToPdf(editor, options).then(result => result.pdf),
    { filename, download, onDone, onError },
    'typeset',
  );
}

export function registerPdfTypeset(
  editor: LexicalEditor,
  config: PdfTypesetConfig = {},
): () => void {
  return editor.registerCommand(
    EXPORT_PDF_TYPESET_COMMAND,
    payload => {
      exportPdfTypeset(editor, { ...config, ...payload }).catch(
        () => undefined,
      );
      return true;
    },
    COMMAND_PRIORITY_EDITOR,
  );
}

export const PdfTypesetExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/PdfTypeset',
  config: {} as PdfTypesetConfig,
  register: (editor, config) => registerPdfTypeset(editor, config),
  build: (editor, config) => ({
    export: (request: PdfTypesetRequest = {}) =>
      exportPdfTypeset(editor, { ...config, ...request }),
    typeset: (options: TypstExportOptions = {}) =>
      typesetToPdf(editor, { ...config, ...options }),
    /** The Typst markup alone, without compiling. */
    markup: (options: TypstExportOptions = {}) =>
      lexicalToTypst(editor, { ...config, ...options }),
  }),
});

// ── All four ─────────────────────────────────────────────────────────

/** The four PDF routes together; part of `JupyterLexicalExtension`. */
export const PdfExportExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/PdfExport',
  dependencies: [
    PdfPrintExtension,
    PdfDocumentExtension,
    PdfSnapshotExtension,
    PdfTypesetExtension,
  ],
});
