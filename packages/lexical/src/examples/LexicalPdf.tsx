/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * PDF export, four ways.
 *
 * The sample document on the left; on the right, one card per route —
 * print, vector document, raster snapshot, Typst typesetting — each with a
 * button, what it did (time, size, pages) and a preview of the PDF it made.
 * All four are pure TypeScript: no server, nothing installed; the Typst
 * compiler is fetched from a CDN the first time it is used.
 *
 * @module examples/LexicalPdf
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Heading, Label, Text } from '@primer/react';
import { DownloadIcon, EyeIcon } from '@primer/octicons-react';
import { AppearanceMenuWithStore, Box } from '@datalayer/primer-addons';
import type { LexicalEditor } from 'lexical';
import { bytesToObjectUrl, countPdfPages, downloadBytes } from '../convert/pdf';
import {
  exportPdfDocument,
  exportPdfSnapshot,
  printPdf,
  typesetToPdf,
} from '../extensions/PdfExportExtension';
import {
  Editor,
  LexicalPrimerThemeProvider,
  LexicalProvider,
  useLexical,
} from './..';
import { PDF_ROUTES, type PdfRoute } from './components/PdfExportMenu';
import { useExampleThemeStore } from './themeStore';

import LEXICAL_MODEL from './content/Example.lexical.json';

const INITIAL_LEXICAL_STATE = JSON.stringify(LEXICAL_MODEL);

interface Result {
  bytes: Uint8Array;
  ms: number;
  pages: number;
  typst?: string;
}

const ROUTE_NOTES: Record<
  PdfRoute,
  { pros: string; cons: string; run: string }
> = {
  print: {
    pros: 'Everything the editor shows, laid out by the browser. No dependency.',
    cons: 'A dialog, not a file: the reader chooses "Save as PDF".',
    run: 'Print…',
  },
  document: {
    pros: 'Real, selectable text; tiny files; runs anywhere, headless too.',
    cons: 'Standard fonts only (Latin-1); pictures are drawn by the browser first.',
    run: 'Export document',
  },
  snapshot: {
    pros: 'Exactly what is on screen, including charts and drawings.',
    cons: 'Text becomes pixels: not searchable, larger files.',
    run: 'Export snapshot',
  },
  typeset: {
    pros: 'Real typesetting: justified text, hyphenation, LaTeX math via mitex.',
    cons: 'A 20 MB engine downloaded on first use; needs the network.',
    run: 'Typeset',
  },
};

const RouteCard = ({
  route,
  editor,
}: {
  route: PdfRoute;
  editor: LexicalEditor | null;
}) => {
  const info = PDF_ROUTES.find(r => r.id === route);
  const notes = ROUTE_NOTES[route];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [preview, setPreview] = useState(false);
  const [showTypst, setShowTypst] = useState(false);
  const url = useMemo(
    () => (result && preview ? bytesToObjectUrl(result.bytes) : null),
    [result, preview],
  );
  useEffect(
    () => () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    },
    [url],
  );

  const run = async () => {
    if (!editor) {
      return;
    }
    setBusy(true);
    setError(null);
    const started = performance.now();
    try {
      if (route === 'print') {
        await printPdf(editor, { title: 'Jupyter Lexical' });
        setResult(null);
      } else {
        let bytes: Uint8Array;
        let typst: string | undefined;
        if (route === 'document') {
          bytes = await exportPdfDocument(editor, {
            download: false,
            author: 'Jupyter Lexical',
          });
        } else if (route === 'snapshot') {
          bytes = await exportPdfSnapshot(editor, { download: false });
        } else {
          const typeset = await typesetToPdf(editor, {
            title: 'Jupyter Lexical',
            author: 'Datalayer',
          });
          bytes = typeset.pdf;
          typst = typeset.typst;
        }
        setResult({
          bytes,
          ms: Math.round(performance.now() - started),
          pages: countPdfPages(bytes),
          typst,
        });
        setPreview(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box
      data-route={route}
      sx={{
        border: '1px solid',
        borderColor: 'border.default',
        borderRadius: 2,
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Heading as="h3" sx={{ fontSize: 2, m: 0, flex: 1 }}>
          {info?.name.replace('…', '')}
        </Heading>
        <Label variant={route === 'typeset' ? 'accent' : 'secondary'}>
          {route === 'print'
            ? 'no dependency'
            : route === 'typeset'
              ? 'WebAssembly'
              : 'pure TypeScript'}
        </Label>
      </Box>
      <Text sx={{ fontSize: 1, color: 'fg.muted' }}>{info?.description}</Text>
      <Text sx={{ fontSize: 0 }}>
        <Text sx={{ fontWeight: 'bold' }}>For:</Text> {notes.pros}
      </Text>
      <Text sx={{ fontSize: 0 }}>
        <Text sx={{ fontWeight: 'bold' }}>Against:</Text> {notes.cons}
      </Text>
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}
      >
        <Button
          variant="primary"
          onClick={() => void run()}
          disabled={busy || !editor}
          data-action="run"
        >
          {busy ? 'Working…' : notes.run}
        </Button>
        {result && (
          <>
            <Button
              leadingVisual={DownloadIcon}
              onClick={() =>
                downloadBytes(`jupyter-lexical-${route}.pdf`, result.bytes)
              }
            >
              Download
            </Button>
            <Button leadingVisual={EyeIcon} onClick={() => setPreview(p => !p)}>
              {preview ? 'Hide preview' : 'Preview'}
            </Button>
            {result.typst && (
              <Button onClick={() => setShowTypst(s => !s)}>
                {showTypst ? 'Hide Typst' : 'Show Typst'}
              </Button>
            )}
            <Text sx={{ fontSize: 0, color: 'fg.muted' }} data-result>
              {result.pages || '?'} page{result.pages === 1 ? '' : 's'} ·{' '}
              {(result.bytes.length / 1024).toFixed(0)} KB · {result.ms} ms
            </Text>
          </>
        )}
      </Box>
      {error && (
        <Text sx={{ fontSize: 0, color: 'danger.fg' }} role="alert">
          {error}
        </Text>
      )}
      {url && (
        <iframe
          title={`${route} PDF preview`}
          src={url}
          style={{
            width: '100%',
            height: 480,
            border: '1px solid var(--borderColor-default, #d0d7de)',
            borderRadius: 6,
          }}
        />
      )}
      {showTypst && result?.typst && (
        <Box
          as="pre"
          sx={{
            fontSize: 0,
            maxHeight: 320,
            overflow: 'auto',
            bg: 'canvas.subtle',
            p: 2,
            borderRadius: 2,
            m: 0,
          }}
        >
          {result.typst}
        </Box>
      )}
    </Box>
  );
};

const PdfPanel = () => {
  const { editor } = useLexical();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {PDF_ROUTES.map(route => (
        <RouteCard key={route.id} route={route.id} editor={editor ?? null} />
      ))}
    </Box>
  );
};

const PdfDocument = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  return (
    <Box
      ref={editorRef}
      sx={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 3fr) minmax(320px, 2fr)',
        gap: 4,
        alignItems: 'start',
        px: 3,
        pb: 4,
      }}
    >
      <Box className="center" sx={{ minWidth: 0 }}>
        <Editor
          initialEditorState={INITIAL_LEXICAL_STATE}
          runtimeEnabled={false}
        />
      </Box>
      <PdfPanel />
    </Box>
  );
};

export function LexicalPdf() {
  return (
    <LexicalPrimerThemeProvider useStore={useExampleThemeStore}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', px: 3, py: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Heading as="h2" sx={{ mb: 1 }}>
            PDF Export
          </Heading>
          <Text as="p" sx={{ m: 0, color: 'fg.muted' }}>
            The same document to PDF four ways, all in the browser: print,
            vector layout, raster snapshot, Typst typesetting.
          </Text>
        </Box>
        <AppearanceMenuWithStore useStore={useExampleThemeStore} />
      </Box>
      <LexicalProvider>
        <PdfDocument />
      </LexicalProvider>
    </LexicalPrimerThemeProvider>
  );
}

export default LexicalPdf;
