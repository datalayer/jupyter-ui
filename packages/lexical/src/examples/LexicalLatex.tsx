/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * LaTeX templates, read and written.
 *
 * One sample per Overleaf template category, in the idiom of its best-known
 * template: a two-column IEEE article, a `moderncv` résumé, a `letter`, a
 * beamer deck and poster, a three-column newsletter, a thesis. Pick one and
 * it is read into a Lexical editor — title block, columns, theorems, blocks,
 * tables, figures, listings, math — where it can be written in; the source
 * tab shows the LaTeX, editable too. Each tab writes to the other on
 * leaving, through `$convertToLatexString` and `$convertFromLatexString`.
 *
 * @module examples/LexicalLatex
 */

import { useMemo, useRef, useState } from 'react';
import {
  ActionList,
  ActionMenu,
  Button,
  Heading,
  Text,
  UnderlineNav,
} from '@primer/react';
import { DownloadIcon, FileIcon, UndoIcon } from '@primer/octicons-react';
import { AppearanceMenuWithStore, Box } from '@datalayer/primer-addons';
import type { LexicalEditor } from 'lexical';
import {
  $convertToLatexString,
  LATEX_TEMPLATE_CATEGORIES,
  LATEX_TEMPLATES,
  LATEX_TRANSFORMERS,
  parsePreamble,
  splitDocument,
  type LatexTemplate,
} from '../convert';
import { LexicalPrimerThemeProvider } from './..';
import { LatexView, SourceEditor } from './components/LatexViews';
import { PdfExportMenu } from './components/PdfExportMenu';
import { useExampleThemeStore } from './themeStore';

import '@datalayer/jupyter-react/style/index.css';

type TabType = 'latex' | 'source';

/** Hand the browser a file made of `text`. */
const download = (filename: string, text: string) => {
  const blob = new Blob([text], { type: 'application/x-tex' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const TemplateMenu = ({
  selected,
  onSelect,
}: {
  selected: LatexTemplate;
  onSelect: (template: LatexTemplate) => void;
}) => (
  <ActionMenu>
    <ActionMenu.Button leadingVisual={FileIcon}>
      {selected.category}: {selected.name}
    </ActionMenu.Button>
    <ActionMenu.Overlay width="large">
      <ActionList selectionVariant="single">
        {LATEX_TEMPLATE_CATEGORIES.map(category => {
          const templates = LATEX_TEMPLATES.filter(
            t => t.category === category,
          );
          return (
            <ActionList.Group key={category}>
              <ActionList.GroupHeading>{category}</ActionList.GroupHeading>
              {templates.map(template => (
                <ActionList.Item
                  key={template.id}
                  selected={template.id === selected.id}
                  onSelect={() => onSelect(template)}
                >
                  {template.name}
                  <ActionList.Description variant="block">
                    {template.description}
                  </ActionList.Description>
                </ActionList.Item>
              ))}
            </ActionList.Group>
          );
        })}
      </ActionList>
    </ActionMenu.Overlay>
  </ActionMenu>
);

const LatexTemplates = () => {
  const [template, setTemplate] = useState<LatexTemplate>(LATEX_TEMPLATES[0]);
  const [latex, setLatex] = useState(template.source);
  const [tab, setTab] = useState<TabType>('latex');
  const latexEditorRef = useRef<LexicalEditor | null>(null);
  const editedSource = useRef<string | null>(null);

  const info = useMemo(
    () => parsePreamble(splitDocument(latex).preamble),
    [latex],
  );

  /** The LaTeX as the editable view would write it now. */
  const readEditor = () =>
    latexEditorRef.current
      ? latexEditorRef.current.getEditorState().read(() =>
          // The title block comes from the document itself; `twocolumn`
          // is already in the layout the columns were read into.
          $convertToLatexString(LATEX_TRANSFORMERS, {
            document: true,
            documentClass: info.documentClass ?? 'article',
            classOptions: info.classOptions.filter(
              option => option !== 'twocolumn',
            ),
          }),
        )
      : null;

  const goToTab = (event: React.MouseEvent, to: TabType) => {
    event.preventDefault();
    if (to === tab) {
      return;
    }
    if (tab === 'latex') {
      const written = readEditor();
      if (written !== null && written !== latex) {
        setLatex(written);
      }
    } else if (
      editedSource.current !== null &&
      editedSource.current !== latex
    ) {
      setLatex(editedSource.current);
    }
    editedSource.current = null;
    setTab(to);
  };

  const choose = (next: LatexTemplate) => {
    setTemplate(next);
    setLatex(next.source);
    editedSource.current = null;
    setTab('latex');
  };

  const summary = [
    info.documentClass &&
      `\\documentclass${info.classOptions.length ? `[${info.classOptions.join(',')}]` : ''}{${info.documentClass}}`,
    info.title ?? info.name,
    info.author,
    info.macros.length > 0 &&
      `${info.macros.length} macro${info.macros.length > 1 ? 's' : ''}`,
  ].filter(Boolean);

  return (
    <Box className="center">
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          flexWrap: 'wrap',
          mb: 2,
        }}
      >
        <TemplateMenu selected={template} onSelect={choose} />
        <Button leadingVisual={UndoIcon} onClick={() => choose(template)}>
          Reset
        </Button>
        <Button
          leadingVisual={DownloadIcon}
          onClick={() =>
            download(
              `${template.id}.tex`,
              editedSource.current ?? readEditor() ?? latex,
            )
          }
        >
          Download .tex
        </Button>
        <PdfExportMenu
          getEditor={() => latexEditorRef.current}
          filename={template.id}
        />
      </Box>
      <Text as="p" sx={{ color: 'fg.muted', fontSize: 0, m: 0, mb: 2 }}>
        {summary.join(' · ')}
      </Text>

      <UnderlineNav aria-label="LaTeX views">
        <UnderlineNav.Item
          href=""
          aria-current={tab === 'latex' ? 'page' : undefined}
          onClick={event => goToTab(event, 'latex')}
        >
          LaTeX
        </UnderlineNav.Item>
        <UnderlineNav.Item
          href=""
          aria-current={tab === 'source' ? 'page' : undefined}
          onClick={event => goToTab(event, 'source')}
        >
          LaTeX Source
        </UnderlineNav.Item>
      </UnderlineNav>

      {tab === 'latex' && (
        <Box sx={{ mt: 3 }}>
          <Text as="p" sx={{ color: 'fg.muted', mb: 2 }}>
            The template read into an editor. Write in it: the source tab shows
            what it has become.
          </Text>
          <LatexView
            latex={latex}
            editable
            onEditor={editor => {
              latexEditorRef.current = editor;
            }}
          />
        </Box>
      )}

      {tab === 'source' && (
        <Box sx={{ mt: 3 }}>
          <Text as="p" sx={{ color: 'fg.muted', mb: 2 }}>
            The LaTeX. Edit it: the LaTeX tab reads it when you go back.
          </Text>
          <SourceEditor
            value={latex}
            label="LaTeX source"
            onChange={text => {
              editedSource.current = text;
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export function LexicalLatex() {
  return (
    <LexicalPrimerThemeProvider useStore={useExampleThemeStore}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', px: 3, py: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Heading as="h2" sx={{ mb: 1 }}>
            LaTeX Templates
          </Heading>
          <Text as="p" sx={{ m: 0, color: 'fg.muted' }}>
            One template per Overleaf category, rendered and edited in Lexical,
            with its source beside.
          </Text>
        </Box>
        <AppearanceMenuWithStore useStore={useExampleThemeStore} />
      </Box>
      <LatexTemplates />
    </LexicalPrimerThemeProvider>
  );
}

export default LexicalLatex;
