/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The four PDF export commands as React plug-ins, for editors built with
 * `LexicalComposer`; editors on `JupyterLexicalExtension` have them already.
 *
 * @module plugins/PdfExportPlugin
 */

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  registerPdfDocument,
  registerPdfPrint,
  registerPdfSnapshot,
  registerPdfTypeset,
  type PdfTypesetConfig,
} from '../extensions/PdfExportExtension';
import type { PdfDocumentOptions } from '../convert/pdf/LexicalToPdf';
import type { PrintToPdfOptions } from '../convert/pdf/PrintToPdf';
import type { SnapshotToPdfOptions } from '../convert/pdf/DomToPdf';

export {
  EXPORT_PDF_DOCUMENT_COMMAND,
  EXPORT_PDF_SNAPSHOT_COMMAND,
  EXPORT_PDF_TYPESET_COMMAND,
  PRINT_PDF_COMMAND,
} from '../extensions/PdfExportExtension';

export function PdfPrintPlugin(props: PrintToPdfOptions): null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => registerPdfPrint(editor, props), [editor, props]);
  return null;
}

export function PdfDocumentPlugin(props: PdfDocumentOptions): null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => registerPdfDocument(editor, props), [editor, props]);
  return null;
}

export function PdfSnapshotPlugin(props: SnapshotToPdfOptions): null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => registerPdfSnapshot(editor, props), [editor, props]);
  return null;
}

export function PdfTypesetPlugin(props: PdfTypesetConfig): null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => registerPdfTypeset(editor, props), [editor, props]);
  return null;
}

/** All four at once. */
export function PdfExportPlugin(): null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    const unregister = [
      registerPdfPrint(editor),
      registerPdfDocument(editor),
      registerPdfSnapshot(editor),
      registerPdfTypeset(editor),
    ];
    return () => unregister.forEach(fn => fn());
  }, [editor]);
  return null;
}

export default PdfExportPlugin;
