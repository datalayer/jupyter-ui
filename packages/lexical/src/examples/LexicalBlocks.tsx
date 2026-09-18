/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The video, Loom and deck blocks, in a document.
 *
 * Opens on a video block recording in the page, a Loom video, an empty Loom
 * block to record into, and a deck of three slides. Type `/` for more:
 * "Video", "Loom Video" and "Deck Slide".
 *
 * The video block needs nothing: the browser records, and the page keeps the
 * file in memory until it reloads. Recording with Loom needs a Loom public
 * app id, read from the environment when the
 * dev server starts — this repository is public and keeps none:
 *
 * ```sh
 * echo 'LOOM_PUBLIC_APP_ID=…' >> .env.local   # git-ignored; or set it in the shell
 * npm run start:vite
 * ```
 *
 * and a React 18 for the recorder, once: `npm run install:react18`.
 *
 * @module examples/LexicalBlocks
 */

import { Heading, Text } from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import { configExtension } from 'lexical';
import {
  Editor,
  LexicalPrimerThemeProvider,
  LexicalProvider,
  LoomExtension,
} from '..';
import { useExampleThemeStore } from './themeStore';

/** Given by the bundler from the environment; empty when it was not set. */
const LOOM_PUBLIC_APP_ID = process.env.LOOM_PUBLIC_APP_ID || undefined;

/*
 * Module-level, so the array is the same on every render: the editor is
 * rebuilt whenever its extensions change.
 */
const EXTENSIONS = [
  configExtension(LoomExtension, { publicAppId: LOOM_PUBLIC_APP_ID }),
];

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

const INITIAL_STATE = JSON.stringify({
  root: {
    children: [
      {
        children: [text('Video, Loom and deck blocks')],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h1',
      },
      paragraph(
        'Type / and pick "Video", "Loom Video" or "Deck Slide" to add more. Pasting a Loom address offers to embed it.',
      ),
      paragraph(
        "A Video block: the browser records the screen or the camera, with no account. The video stays in this page's memory and is lost on reload.",
      ),
      {
        type: 'video',
        version: 1,
        format: '',
        recordingId: '',
        recorded: false,
      },
      paragraph('A Loom Video: recorded with a Loom account, and saved there.'),
      {
        type: 'loom',
        version: 1,
        format: '',
        url: 'https://www.loom.com/share/c2b5b05f548d4f1492d5c107f0c48dbc',
        width: 1920,
        height: 1440,
      },
      paragraph(
        'An empty Loom Video block: record with your Loom account, or give the address of a Loom video.',
      ),
      { type: 'loom', version: 1, format: '', url: '' },
      paragraph(
        'A deck: click it, then the arrow keys move it; double-click it to edit its specification, and Save redraws it.',
      ),
      {
        type: 'deck',
        version: 1,
        format: '',
        spec: {
          deck: { title: 'Decks in a document', template: 'datalayer' },
          slides: [
            {
              type: 'title',
              title: 'Decks in a document',
              meta: 'Double-click to edit the specification',
            },
            {
              type: 'bullets',
              title: 'What a deck block does',
              items: [
                'Draws a `DeckSpec` with **@datalayer/decks**',
                'Click it, then the arrow keys to move',
                'Double-click it, or its pencil, to edit the JSON',
                'Save checks the specification first and says what is wrong',
              ],
            },
            {
              type: 'statement',
              statement: 'Slides are data; the template decides how they look.',
            },
          ],
        },
      },
      paragraph(''),
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
});

export const LexicalBlocks = () => (
  <LexicalPrimerThemeProvider useStore={useExampleThemeStore}>
    <Box sx={{ p: 3, display: 'grid', gap: 2 }}>
      <Box>
        <Heading as="h2" sx={{ mb: 1 }}>
          Video, Loom and Deck Blocks
        </Heading>
        <Text as="p" sx={{ m: 0, color: 'var(--fgColor-muted)' }}>
          Record a video in the page, or with your Loom account; draw a deck and
          edit its specification.
          {LOOM_PUBLIC_APP_ID
            ? ''
            : ' Loom recording is off: put LOOM_PUBLIC_APP_ID=… in packages/lexical/.env.local, or in the shell, and restart the dev server.'}
        </Text>
      </Box>
      <LexicalProvider>
        <Editor
          initialEditorState={INITIAL_STATE}
          extensions={EXTENSIONS}
          runtimeEnabled={false}
        />
      </LexicalProvider>
    </Box>
  </LexicalPrimerThemeProvider>
);

export default LexicalBlocks;
