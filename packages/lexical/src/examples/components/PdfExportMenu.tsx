/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * "Export PDF" with the four routes, for an example's header. Dispatches
 * the extension commands on the editor it is given.
 *
 * @module examples/components/PdfExportMenu
 */

import { useState } from 'react';
import { ActionList, ActionMenu, Spinner, Text } from '@primer/react';
import { FileIcon } from '@primer/octicons-react';
import { Box } from '@datalayer/primer-addons';
import type { LexicalEditor } from 'lexical';
import {
  EXPORT_PDF_DOCUMENT_COMMAND,
  EXPORT_PDF_SNAPSHOT_COMMAND,
  EXPORT_PDF_TYPESET_COMMAND,
  PRINT_PDF_COMMAND,
} from '../../extensions/PdfExportExtension';

export type PdfRoute = 'print' | 'document' | 'snapshot' | 'typeset';

export const PDF_ROUTES: Array<{
  id: PdfRoute;
  name: string;
  description: string;
}> = [
  {
    id: 'print',
    name: 'Print…',
    description:
      'The browser prints the rendered document; save as PDF from the dialog.',
  },
  {
    id: 'document',
    name: 'Document (vector)',
    description:
      'Laid out from the document model with the standard fonts: real text, small file.',
  },
  {
    id: 'snapshot',
    name: 'Snapshot (raster)',
    description:
      'The rendered document drawn to a canvas and cut into page images.',
  },
  {
    id: 'typeset',
    name: 'Typeset (Typst)',
    description:
      'Typst markup compiled by the Typst engine in WebAssembly, loaded from a CDN.',
  },
];

export const PdfExportMenu = ({
  getEditor,
  filename,
}: {
  getEditor: () => LexicalEditor | null;
  /** The base of the file name, without `.pdf`. */
  filename?: string;
}) => {
  const [busy, setBusy] = useState<PdfRoute | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = (route: PdfRoute) => {
    const editor = getEditor();
    if (!editor) {
      setError('No editor to export.');
      return;
    }
    setError(null);
    setBusy(route);
    const done = () => setBusy(null);
    const fail = (e: unknown) => {
      setBusy(null);
      setError(e instanceof Error ? e.message : String(e));
    };
    const name = filename ? `${filename}-${route}.pdf` : undefined;
    switch (route) {
      case 'print':
        editor.dispatchCommand(PRINT_PDF_COMMAND, {
          onDone: done,
          onError: fail,
        });
        break;
      case 'document':
        editor.dispatchCommand(EXPORT_PDF_DOCUMENT_COMMAND, {
          filename: name,
          onDone: done,
          onError: fail,
        });
        break;
      case 'snapshot':
        editor.dispatchCommand(EXPORT_PDF_SNAPSHOT_COMMAND, {
          filename: name,
          onDone: done,
          onError: fail,
        });
        break;
      case 'typeset':
        editor.dispatchCommand(EXPORT_PDF_TYPESET_COMMAND, {
          filename: name,
          onDone: done,
          onError: fail,
        });
        break;
      default:
        break;
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <ActionMenu>
        <ActionMenu.Button leadingVisual={FileIcon} disabled={busy !== null}>
          {busy ? `Exporting ${busy}…` : 'Export PDF'}
        </ActionMenu.Button>
        <ActionMenu.Overlay width="medium">
          <ActionList>
            {PDF_ROUTES.map(route => (
              <ActionList.Item key={route.id} onSelect={() => run(route.id)}>
                {route.name}
                <ActionList.Description variant="block">
                  {route.description}
                </ActionList.Description>
              </ActionList.Item>
            ))}
          </ActionList>
        </ActionMenu.Overlay>
      </ActionMenu>
      {busy && <Spinner size="small" />}
      {error && (
        <Text sx={{ color: 'var(--fgColor-danger)', fontSize: 0 }} role="alert">
          {error}
        </Text>
      )}
    </Box>
  );
};

export default PdfExportMenu;
