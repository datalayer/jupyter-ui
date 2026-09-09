/**
 * @jest-environment jsdom
 */
/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The PDF extensions on an editor: the document command answers with a PDF,
 * the typeset extension's output gives the Typst markup, and the print
 * route builds a printable copy of the rendered DOM and hands it to print.
 */

import { describe, expect, it, jest } from '@jest/globals';

jest.mock('@datalayer/jupyter-react', () => ({ __esModule: true }));

import {
  buildEditorFromExtensions,
  getExtensionDependencyFromEditor,
} from '@lexical/extension';
import { CodeExtension } from '@lexical/code';
import { LinkExtension } from '@lexical/link';
import { ListExtension } from '@lexical/list';
import { RichTextExtension } from '@lexical/rich-text';
import { $createHeadingNode } from '@lexical/rich-text';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
  defineExtension,
} from 'lexical';
import { HeadingNode } from '@lexical/rich-text';
import {
  EXPORT_PDF_DOCUMENT_COMMAND,
  PdfExportExtension,
  PdfTypesetExtension,
} from '../PdfExportExtension';
import { buildPrintHtml, printEditorToPdf } from '../../convert/pdf/PrintToPdf';
import { countPdfPages } from '../../convert/pdf/PdfWriter';

const TestExtension = defineExtension({
  name: '[test]',
  dependencies: [
    RichTextExtension,
    ListExtension,
    LinkExtension,
    CodeExtension,
    PdfExportExtension,
  ],
});

function $seed() {
  const root = $getRoot();
  root.clear();
  const heading = $createHeadingNode('h1');
  heading.append($createTextNode('Exported Title'));
  const paragraph = $createParagraphNode();
  paragraph.append(
    $createTextNode('Body text, '),
    $createTextNode('bold').toggleFormat('bold'),
  );
  root.append(heading, paragraph);
}

describe('the PDF extensions', () => {
  it('answer the document command with a PDF and offer Typst markup', async () => {
    const editor = buildEditorFromExtensions(TestExtension);
    editor.update($seed, { discrete: true });
    const bytes = await new Promise<Uint8Array>((resolve, reject) => {
      const handled = editor.dispatchCommand(EXPORT_PDF_DOCUMENT_COMMAND, {
        download: false,
        pictures: false,
        onDone: resolve,
        onError: reject,
      });
      expect(handled).toBe(true);
    });
    expect(String.fromCharCode(...bytes.slice(0, 5))).toBe('%PDF-');
    expect(countPdfPages(bytes)).toBe(1);

    const typeset = getExtensionDependencyFromEditor(
      editor,
      PdfTypesetExtension,
    ).output;
    const { main } = await typeset.markup();
    expect(main).toContain('= Exported Title');
    expect(main).toContain('Body text, #strong[bold]');
    expect(main).toContain('#set document(title: "Exported Title")');
  });

  it('print: a light, non-editable copy of the rendered document reaches print', async () => {
    const editor = createEditor({
      nodes: [HeadingNode],
      onError: error => {
        throw error;
      },
    });
    const host = document.createElement('div');
    host.setAttribute('data-color-mode', 'dark');
    host.className = 'jp-ThemedContainer dark-theme';
    const root = document.createElement('div');
    root.contentEditable = 'true';
    root.className = 'editor-input';
    host.appendChild(root);
    document.body.appendChild(host);
    editor.setRootElement(root);
    editor.update($seed, { discrete: true });

    const html = buildPrintHtml(editor, { title: 'Printed' });
    expect(html).toContain('<title>Printed</title>');
    expect(html).toContain('Exported Title');
    expect(html).toContain('class="jupyter-lexical-print');
    expect(html).toContain('data-color-mode="light"');
    expect(html).not.toContain('dark-theme');
    expect(html).not.toMatch(/contenteditable=/i);
    expect(html).toContain('@page { size: A4; margin: 18mm; }');

    const printed: string[] = [];
    await printEditorToPdf(editor, {
      title: 'Printed',
      timeoutMs: 10,
      print: win => {
        printed.push(win.document.body.textContent ?? '');
      },
    });
    expect(printed.length).toBe(1);
    expect(printed[0]).toContain('Exported Title');
    host.remove();
  });
});
