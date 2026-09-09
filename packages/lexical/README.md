[![Datalayer](https://assets.datalayer.tech/datalayer-25.svg)](https://datalayer.io)

[![Become a Sponsor](https://img.shields.io/static/v1?label=Become%20a%20Sponsor&message=%E2%9D%A4&logo=GitHub&style=flat&color=1ABC9C)](https://github.com/sponsors/datalayer)

# 🪐 ✍️ Jupyter Lexical

> A literate Jupyter for accessible and reproducible data analysis.

<div align="center" style="text-align: center">
  <img alt="Jupyter UI Slate" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-slate.gif" />
</div>

## Extensions

The editor is built with [Lexical extensions](https://lexical.dev/docs/extensions/intro):
every behaviour of this package is an extension in `src/extensions`, and
`JupyterLexicalExtension` bundles them all. A host depends on the bundle from
its own root extension, adds what is its own — namespace, theme, initial
state, focus on mount — and renders the content editable where it wants it:

```tsx
import { AutoFocusExtension } from '@lexical/extension';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import {
  JupyterLexicalExtension,
  commentTheme,
} from '@datalayer/jupyter-lexical';
import { defineExtension } from 'lexical';

// Module scope: the composer rebuilds the editor whenever this reference changes.
const extension = defineExtension({
  name: 'my-app/Document',
  namespace: 'my-document',
  theme: commentTheme,
  dependencies: [JupyterLexicalExtension, AutoFocusExtension],
});

export const Document = () => (
  <LexicalExtensionComposer extension={extension} contentEditable={null}>
    <ContentEditable className="editor-input" />
  </LexicalExtensionComposer>
);
```

Bundled behaviours are reconfigured from the root with `configExtension`, for
instance `configExtension(HistoryExtension, { disabled: true })` for a
collaborative document, or `configExtension(ListMaxIndentLevelExtension, { maxDepth: 3 })`.
Some of them expose signals in their output so a live editor can be
reconfigured without being rebuilt — the list ceiling, or the `lexicalId` and
`serviceManager` of `LexicalStateExtension` that register the editor in the
shared store for agent tools.

Two kinds of behaviour need the host: what only the host has (a kernel,
completion providers) and what hangs off the host's DOM (floating menus).
The first are output components — `JupyterInputOutputExtension`,
`ComponentPickerMenuExtension` and `InlineCompletionExtension` — placed with
`useExtensionComponent` or `<ExtensionComponent lexical:extension={…} />`;
the second stay React plug-ins rendered as children of the composer, as do
the toolbar, the comments panel and the collaboration provider.

Every extension keeps a React plug-in of the same name in `src/plugins` for an
editor still built with `LexicalComposer`; the plug-in is a thin wrapper over
the extension's `register…` function, so both paths share one implementation.

## Formats

A document goes in and out of other formats through `src/convert`:

- **Markdown** — `$convertToMarkdownString` / `$convertFromMarkdownString`
  with the package's transformers (tables, images, equations, rules, and
  fenced code as executable Jupyter inputs).
- **nbformat** — `lexicalToNbformat(nodes)` writes a code cell per Jupyter
  input with its outputs and one Markdown cell per run of anything else;
  `nbformatToLexical(notebook, editor)` reads a notebook back (the
  input/output plug-in must be mounted for the code cells).
- **LaTeX** — `$convertToLatexString(transformers?, { document, documentClass,
classOptions, title, author, date })` and `$convertFromLatexString(latex,
transformers?)`, built on transformers shaped after `@lexical/markdown`'s
  (`LATEX_TRANSFORMERS`): the title block (`\title`, `\author`, `\date`,
  `\maketitle`), headings from `\part` to `\subparagraph`, paragraphs and
  text formats, quotes and abstracts, theorem environments and proofs,
  lists, check lists and description lists, listings (`lstlisting`,
  `minted`, `verbatim`), algorithms, tables (`tabular` and friends,
  `\multicolumn` as spanning cells), figures, rules, inline and display
  math (AMS environments included), links, YouTube embeds, footnotes,
  citations and `thebibliography`, TeX dashes and quotes. `\newcommand`
  macros from the preamble are expanded. Columns are read into layout
  nodes: `multicols` (at `\columnbreak`, or evenly), beamer `columns`,
  side-by-side `minipage`s, and the `twocolumn` class option; they are
  written back as `multicols`. Beamer frames become sections and their
  `block`s collapsible boxes; `moderncv` entries and the `letter` class
  (`\opening`, `\closing`, `\signature`, `\ps`) read as prose. A host adds
  a node by adding a transformer. `$importLatex` also returns what the
  preamble said (`LatexDocumentInfo`).
- **LaTeX templates** — `LATEX_TEMPLATES` holds one document per Overleaf
  template category (journal article, bibliography, book, calendar, CV,
  letter, assignment, newsletter, poster, presentation, thesis), each in the
  idiom of the category's best-known template.

- **PDF** — four routes, one extension each, all in the browser and all
  TypeScript (`PdfExportExtension` bundles them; commands and functions in
  `src/extensions/PdfExportExtension.ts`):
  1. `PdfPrintExtension` / `PRINT_PDF_COMMAND` — the rendered document,
     cloned into a hidden iframe with the page's stylesheets and a print
     stylesheet, printed by the browser (what JupyterLab does). Highest
     fidelity; the reader saves as PDF from the dialog.
  2. `PdfDocumentExtension` / `EXPORT_PDF_DOCUMENT_COMMAND` — a vector PDF
     laid out from the document model (`src/convert/pdf`: a small PDF writer
     over the standard 14 fonts, a layout engine for headings, paragraphs,
     lists, code, tables, columns, quotes, boxes). Text stays text; pictures
     — equations through KaTeX, images, drawings, rich outputs — are drawn by
     the browser and placed as JPEGs. Runs headless with `pictures: false`.
  3. `PdfSnapshotExtension` / `EXPORT_PDF_SNAPSHOT_COMMAND` — the editor
     drawn to a canvas with html2canvas and cut into page images at the
     whitest row near each cut. Everything as shown, nothing selectable.
  4. `PdfTypesetExtension` / `EXPORT_PDF_TYPESET_COMMAND` — the document as
     Typst markup (`src/convert/typst`), compiled by the Typst engine in
     WebAssembly, fetched from a CDN on first use (`loadTypstEngine`; both
     URLs configurable). Real typesetting; LaTeX math through the `mitex`
     package from Typst's registry.

The `LexicalFormats` example shows all of them on one document: Markdown
and LaTeX sources you can edit and apply, a live notebook, the nbformat
JSON, and the LaTeX rendered by reading it back into a read-only editor.
The `LexicalLatex` example ("LaTeX Templates") reads each template into an
editable editor beside its source, each written to the other on leaving.
The `LexicalPdf` example ("PDF Export") runs the four PDF routes on the
sample document side by side, with a preview of each result; both other
examples carry an "Export PDF" menu.
