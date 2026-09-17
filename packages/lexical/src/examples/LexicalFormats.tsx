/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * One document, many formats.
 *
 * The Lexical editor is the document and stays mounted throughout; every
 * other tab is a view of it in another format, made when the tab is opened
 * and written back when it is left:
 *
 * - **Markdown** — the document as Markdown text, through the package's
 *   Markdown transformers, in a plain-text editor. Edits are applied to the
 *   document on leaving the tab or with *Apply*.
 * - **Notebook** — the document as a live Jupyter notebook (`lexicalToNbformat`),
 *   with a kernel; cells edited or run there are written back
 *   (`nbformatToLexical`) on leaving.
 * - **Nbformat** — the notebook JSON.
 * - **LaTeX** — the document as LaTeX (`$convertToLatexString`), read back
 *   into a Lexical editor you can write in: equations through KaTeX,
 *   listings, tables, figures, lists as the importer understands them. On
 *   leaving, the editor is exported to LaTeX again and that LaTeX is read
 *   into the document, so what comes back is what LaTeX can carry.
 * - **LaTeX Read-only** — the same rendering, read-only.
 * - **LaTeX Source** — that LaTeX as text, in a plain-text editor; edits are
 *   applied to the document (`$convertFromLatexString`) on leaving or with
 *   *Apply*.
 *
 * @module examples/LexicalFormats
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { $getRoot, $setSelection, type LexicalEditor } from 'lexical';
import {
  useNotebookStore,
  useJupyter,
  Notebook,
  CellSidebar,
  CellSidebarExtension,
} from '@datalayer/jupyter-react';
import { AppearanceMenuWithStore, Box } from '@datalayer/primer-addons';
import { UnderlineNav, Button, Heading, Text } from '@primer/react';
import { DownloadIcon, SyncIcon, UndoIcon } from '@primer/octicons-react';
import { JSONTree } from 'react-json-tree';
import { INotebookContent } from '@jupyterlab/nbformat';
import { INotebookModel } from '@jupyterlab/notebook';
import {
  $convertFromLatexString,
  $convertToLatexString,
  LATEX_TRANSFORMERS,
  lexicalToNbformat,
  nbformatToLexical,
} from '../convert';
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from '../convert/markdown';
import { PLAYGROUND_TRANSFORMERS } from '../convert/transformers/MarkdownTransformers';
import {
  useLexical,
  LexicalProvider,
  Editor,
  LexicalPrimerThemeProvider,
} from './..';
import { useExampleThemeStore } from './themeStore';

import '@datalayer/jupyter-react/style/index.css';

import INITIAL_NBFORMAT_MODEL from './content/Example.ipynb.json';

const NOTEBOOK_UID = 'notebook-uid-lexical-formats';
const DOCUMENT_TITLE = 'Lexical Formats';

type TabType =
  | 'editor'
  | 'markdown'
  | 'notebook'
  | 'nbformat'
  | 'latex'
  | 'latex-readonly'
  | 'latex-source';

const TABS: Array<{ key: TabType; label: string }> = [
  { key: 'editor', label: 'Editor' },
  { key: 'markdown', label: 'Markdown' },
  { key: 'notebook', label: 'Notebook' },
  { key: 'nbformat', label: 'Nbformat' },
  { key: 'latex', label: 'LaTeX' },
  { key: 'latex-readonly', label: 'LaTeX Read-only' },
  { key: 'latex-source', label: 'LaTeX Source' },
];

const cloneNotebookContent = (model: INotebookContent): INotebookContent =>
  JSON.parse(JSON.stringify(model)) as INotebookContent;

/** Hand the browser a file made of `text`. */
const download = (filename: string, text: string, type: string) => {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

import { LatexView, SourceEditor } from './components/LatexViews';
import { PdfExportMenu } from './components/PdfExportMenu';

// ─── Tabs ──────────────────────────────────────────────────────────────────

const FormatsTabs = () => {
  const { editor } = useLexical();
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const notebookStore = useNotebookStore();
  const extensions = useMemo(
    () => [new CellSidebarExtension({ factory: CellSidebar })],
    [],
  );

  const [tab, setTab] = useState<TabType>('editor');
  // Each format, as read from the document when its tab was opened…
  const [markdown, setMarkdown] = useState('');
  const [latex, setLatex] = useState('');
  const [notebookSource, setNotebookSource] = useState<INotebookContent | null>(
    null,
  );
  const [nbformatView, setNbformatView] = useState<INotebookContent | null>(
    null,
  );
  // …and what the person typed in its editor since, if anything.
  const editedMarkdown = useRef<string | null>(null);
  const editedLatex = useRef<string | null>(null);
  const latexEditorRef = useRef<LexicalEditor | null>(null);
  const notebookModelRef = useRef<INotebookModel | null>(null);
  // Bumped so the Notebook loads afresh each time its tab is opened.
  const [notebookVersion, setNotebookVersion] = useState(0);

  const readMarkdown = useCallback(
    () =>
      editor
        ? editor
            .getEditorState()
            .read(() => $convertToMarkdownString(PLAYGROUND_TRANSFORMERS))
        : '',
    [editor],
  );
  const readLatex = useCallback(
    () =>
      editor
        ? editor
            .getEditorState()
            .read(() =>
              $convertToLatexString(LATEX_TRANSFORMERS, { document: true }),
            )
        : '',
    [editor],
  );
  const readNbformat = useCallback(
    () =>
      editor
        ? editor
            .getEditorState()
            .read(() => lexicalToNbformat($getRoot().getChildren()))
        : null,
    [editor],
  );

  /** Replace the document with what `$fill` writes. */
  const replaceDocument = useCallback(
    ($fill: () => void) => {
      editor?.update(
        () => {
          const root = $getRoot();
          $setSelection(null);
          root.clear();
          $fill();
          root.selectEnd();
        },
        { discrete: true },
      );
    },
    [editor],
  );
  const applyMarkdown = useCallback(
    (text: string) =>
      replaceDocument(() =>
        $convertFromMarkdownString(text, PLAYGROUND_TRANSFORMERS),
      ),
    [replaceDocument],
  );
  const applyLatex = useCallback(
    (text: string) =>
      replaceDocument(() => $convertFromLatexString(text, LATEX_TRANSFORMERS)),
    [replaceDocument],
  );
  const applyNotebook = useCallback(() => {
    const model =
      notebookModelRef.current ??
      notebookStore.selectNotebook(NOTEBOOK_UID)?.model;
    if (editor && model) {
      nbformatToLexical(
        cloneNotebookContent(model.toJSON() as INotebookContent),
        editor,
      );
    }
  }, [editor, notebookStore]);

  /** Write a tab's edits back to the document before leaving it. */
  const leave = (from: TabType) => {
    if (
      from === 'markdown' &&
      editedMarkdown.current !== null &&
      editedMarkdown.current !== markdown
    ) {
      applyMarkdown(editedMarkdown.current);
    }
    if (
      from === 'latex-source' &&
      editedLatex.current !== null &&
      editedLatex.current !== latex
    ) {
      applyLatex(editedLatex.current);
    }
    if (from === 'latex' && latexEditorRef.current) {
      // Through LaTeX on the way back too: the document becomes what LaTeX
      // carries of the edited view, and nothing more.
      const written = latexEditorRef.current
        .getEditorState()
        .read(() =>
          $convertToLatexString(LATEX_TRANSFORMERS, { document: true }),
        );
      if (written !== latex) {
        applyLatex(written);
      }
    }
    if (from === 'notebook') {
      applyNotebook();
    }
    editedMarkdown.current = null;
    editedLatex.current = null;
  };

  /** Read the document into the format a tab shows. */
  const enter = (to: TabType) => {
    if (to === 'markdown') {
      setMarkdown(readMarkdown());
    } else if (to === 'notebook') {
      setNotebookSource(readNbformat());
      setNotebookVersion(version => version + 1);
    } else if (to === 'nbformat') {
      setNbformatView(readNbformat());
    } else if (
      to === 'latex' ||
      to === 'latex-readonly' ||
      to === 'latex-source'
    ) {
      setLatex(readLatex());
    }
  };

  const goToTab = (event: React.MouseEvent, to: TabType) => {
    event.preventDefault();
    if (to === tab) {
      return;
    }
    leave(tab);
    // The notebook writes back through queued editor updates: read the
    // document once they have landed.
    setTimeout(() => {
      enter(to);
      setTab(to);
    }, 0);
  };

  const reset = () => {
    if (editor) {
      nbformatToLexical(cloneNotebookContent(INITIAL_NBFORMAT_MODEL), editor);
    }
    editedMarkdown.current = null;
    editedLatex.current = null;
    setTab('editor');
  };

  const nbformatJson = (content: INotebookContent | null) =>
    JSON.stringify(content ?? readNbformat(), null, 2);

  return (
    <Box sx={{ mx: 'auto', maxWidth: 1100, px: 3 }}>
      <UnderlineNav aria-label="Formats">
        {TABS.map(({ key, label }) => (
          <UnderlineNav.Item
            key={key}
            href=""
            aria-current={tab === key ? 'page' : undefined}
            onClick={event => goToTab(event, key)}
          >
            {label}
          </UnderlineNav.Item>
        ))}
      </UnderlineNav>

      {/* The document. Always mounted: the other tabs are views of it. */}
      <Box sx={{ display: tab === 'editor' ? 'block' : 'none' }}>
        <Editor
          notebook={INITIAL_NBFORMAT_MODEL}
          onSessionConnection={() => {
            // Intentionally no-op: avoid noisy session logs on reconnection/state updates.
          }}
        />
        <Box sx={{ mt: 2 }}>
          <Button leadingVisual={UndoIcon} onClick={reset}>
            Reset document
          </Button>
          <PdfExportMenu
            getEditor={() => editor ?? null}
            filename="lexical-formats"
          />
        </Box>
      </Box>

      {tab === 'markdown' && (
        <Box sx={{ mt: 3 }}>
          <Text as="p" sx={{ color: 'var(--fgColor-muted)', mb: 2 }}>
            The document as Markdown, through the package&apos;s transformers.
            Edit it here: your changes are applied to the document when you
            leave the tab, or now with Apply.
          </Text>
          <SourceEditor
            value={markdown}
            label="Markdown source"
            onChange={text => {
              editedMarkdown.current = text;
            }}
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              leadingVisual={SyncIcon}
              onClick={() => {
                if (editedMarkdown.current !== null) {
                  applyMarkdown(editedMarkdown.current);
                  editedMarkdown.current = null;
                  setMarkdown(readMarkdown());
                }
              }}
            >
              Apply to document
            </Button>
            <Button
              leadingVisual={DownloadIcon}
              onClick={() =>
                download(
                  'document.md',
                  editedMarkdown.current ?? markdown,
                  'text/markdown',
                )
              }
            >
              Download .md
            </Button>
          </Box>
        </Box>
      )}

      {tab === 'notebook' && (
        <Box sx={{ mt: 3 }}>
          <Text as="p" sx={{ color: 'var(--fgColor-muted)', mb: 2 }}>
            The document as a Jupyter notebook, on a live kernel. Cells edited
            or run here are written back to the document when you leave the tab.
          </Text>
          {serviceManager && defaultKernel && notebookSource ? (
            <Notebook
              key={notebookVersion}
              id={NOTEBOOK_UID}
              kernel={defaultKernel}
              serviceManager={serviceManager}
              nbformat={notebookSource}
              extensions={extensions}
              height="calc(100vh - 16rem)"
              onNotebookModelChanged={model => {
                notebookModelRef.current = model;
              }}
            />
          ) : (
            <Text sx={{ color: 'var(--fgColor-muted)' }}>
              Waiting for a kernel…
            </Text>
          )}
        </Box>
      )}

      {tab === 'nbformat' && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <Text sx={{ color: 'var(--fgColor-muted)', flex: 1 }}>
              The notebook JSON the Notebook tab loads.
            </Text>
            <Button
              leadingVisual={DownloadIcon}
              onClick={() =>
                download(
                  'document.ipynb',
                  nbformatJson(nbformatView),
                  'application/x-ipynb+json',
                )
              }
            >
              Download .ipynb
            </Button>
          </Box>
          <JSONTree data={nbformatView ?? {}} />
        </Box>
      )}

      {tab === 'latex' && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <Text sx={{ color: 'var(--fgColor-muted)', flex: 1 }}>
              The LaTeX read back into an editor, equations through KaTeX. Write
              in it: when you leave the tab it is exported to LaTeX again and
              that LaTeX is read into the document.
            </Text>
            <Button
              leadingVisual={DownloadIcon}
              onClick={() =>
                download('document.tex', latex, 'application/x-tex')
              }
            >
              Download .tex
            </Button>
          </Box>
          <LatexView
            latex={latex}
            editable
            onEditor={editor => {
              latexEditorRef.current = editor;
            }}
          />
        </Box>
      )}

      {tab === 'latex-readonly' && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <Text sx={{ color: 'var(--fgColor-muted)', flex: 1 }}>
              The same rendering, read-only: what the LaTeX carries of the
              document.
            </Text>
            <Button
              leadingVisual={DownloadIcon}
              onClick={() =>
                download('document.tex', latex, 'application/x-tex')
              }
            >
              Download .tex
            </Button>
          </Box>
          <LatexView latex={latex} editable={false} />
        </Box>
      )}

      {tab === 'latex-source' && (
        <Box sx={{ mt: 3 }}>
          <Text as="p" sx={{ color: 'var(--fgColor-muted)', mb: 2 }}>
            The document as LaTeX. Edit it here: your changes are read back into
            the document when you leave the tab, or now with Apply.
          </Text>
          <SourceEditor
            value={latex}
            label="LaTeX source"
            onChange={text => {
              editedLatex.current = text;
            }}
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              leadingVisual={SyncIcon}
              onClick={() => {
                if (editedLatex.current !== null) {
                  applyLatex(editedLatex.current);
                  editedLatex.current = null;
                  setLatex(readLatex());
                }
              }}
            >
              Apply to document
            </Button>
            <Button
              leadingVisual={DownloadIcon}
              onClick={() =>
                download(
                  'document.tex',
                  editedLatex.current ?? latex,
                  'application/x-tex',
                )
              }
            >
              Download .tex
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export function LexicalFormats() {
  return (
    <LexicalPrimerThemeProvider useStore={useExampleThemeStore}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          px: 3,
          py: 2,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Heading as="h2" sx={{ mb: 1 }}>
            {DOCUMENT_TITLE}
          </Heading>
          <Text as="p" sx={{ m: 0, color: 'var(--fgColor-muted)' }}>
            One document — as rich text, Markdown, a Jupyter notebook, nbformat
            and LaTeX.
          </Text>
        </Box>
        <AppearanceMenuWithStore useStore={useExampleThemeStore} />
      </Box>
      <LexicalProvider>
        <FormatsTabs />
      </LexicalProvider>
    </LexicalPrimerThemeProvider>
  );
}

export default LexicalFormats;
