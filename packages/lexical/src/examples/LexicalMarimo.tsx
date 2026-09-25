/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Marimo cells in a document.
 *
 * Opens on three Marimo cells that read from each other. They share the
 * document's kernel and its reactive graph: run the first (Shift+Enter),
 * change `price` and run it again — the two cells that read `price` run
 * again on their own, in dependency order. Type `/` and pick "Marimo Cell"
 * for another; a plain "Jupyter Cell" runs only when asked.
 *
 * The graph is Marimo's, kept in the kernel and asked over the Jupyter
 * protocol: the kernel is the ordinary one, with marimo installed.
 *
 * @module examples/LexicalMarimo
 */

import { Heading, Text } from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import { Editor, LexicalPrimerThemeProvider, LexicalProvider } from '..';
import { useExampleThemeStore } from './themeStore';

const text = (value: string) => ({
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text: value,
  type: 'text',
  version: 1,
});

const paragraph = (value: string) => ({
  children: [text(value)],
  direction: 'ltr',
  format: '',
  indent: 0,
  type: 'paragraph',
  version: 1,
  textFormat: 0,
  textStyle: '',
});

/** A Marimo cell: the input, then the output that runs it, reactive. */
const marimoCell = (id: string, source: string) => [
  {
    children: [
      {
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        text: source,
        type: 'jupyter-input-highlight',
        version: 1,
        highlightType: 'plain',
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'jupyter-input',
    version: 1,
    language: 'python',
    jupyterInputNodeUuid: `${id}-input`,
  },
  {
    format: '',
    type: 'jupyter-output',
    version: 1,
    source,
    outputs: [],
    jupyterInputNodeUuid: `${id}-input`,
    jupyterOutputNodeUuid: `${id}-output`,
    variant: 'marimo',
  },
];

const INITIAL_STATE = JSON.stringify({
  root: {
    children: [
      {
        children: [text('Marimo cells')],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h1',
      },
      paragraph(
        'Three reactive cells on one kernel. Run the first with Shift+Enter, then change price and run it again: the two below run again on their own.',
      ),
      paragraph('Defines price and quantity:'),
      ...marimoCell('marimo-price', 'price = 10\nquantity = 3'),
      paragraph('Reads them, defines total:'),
      ...marimoCell('marimo-total', 'total = price * quantity\ntotal'),
      paragraph('Reads total:'),
      ...marimoCell(
        'marimo-summary',
        'print(f"{quantity} × {price} = {total}")',
      ),
      paragraph(
        'Type / and pick "Marimo Cell" to add another reactive cell, or "Jupyter Cell" for one that runs only when asked.',
      ),
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
});

export const LexicalMarimo = () => (
  <LexicalPrimerThemeProvider useStore={useExampleThemeStore}>
    <Box sx={{ p: 3, display: 'grid', gap: 2 }}>
      <Box>
        <Heading as="h2" sx={{ mb: 1 }}>
          Marimo Cells
        </Heading>
        <Text as="p" sx={{ m: 0, color: 'var(--fgColor-muted)' }}>
          Reactive cells in a document: running one runs the cells that read
          what it defines. The kernel needs marimo installed.
        </Text>
      </Box>
      <LexicalProvider>
        <Editor initialEditorState={INITIAL_STATE} runtimeEnabled={true} />
      </LexicalProvider>
    </Box>
  </LexicalPrimerThemeProvider>
);

export default LexicalMarimo;
