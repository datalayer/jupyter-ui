/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo, useState, useEffect } from 'react';
import { Button, ToggleSwitch, Text } from '@primer/react';
import {
  AppearanceControlsWithStore,
  Box,
  createThemeStore,
} from '@datalayer/primer-addons';
import { ThreeBarsIcon } from '@primer/octicons-react';
import {
  useLexical,
  Editor,
  LexicalProvider,
  LexicalPrimerThemeProvider,
  nbformatToLexical,
} from '..';

import LEXICAL_MODEL from './content/Example.lexical.json';
import NBFORMAT_MODEL from './content/Example.ipynb.json';

const LexicalEditor = () => {
  const { editor } = useLexical();

  useEffect(() => {
    if (editor) {
      queueMicrotask(() => {
        const editorState = editor.parseEditorState(LEXICAL_MODEL as any);
        editor.setEditorState(editorState);
      });
    }
  }, [editor]);

  return (
    <Box className="center">
      <Box>
        <Editor
          onSessionConnection={session => {
            console.log('Session changed:', session);
          }}
        />
        <Button
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            if (editor) {
              nbformatToLexical(NBFORMAT_MODEL as any, editor);
            }
          }}
        >
          Insert Notebook Model
        </Button>
      </Box>
    </Box>
  );
};

const AppToolbar = (props: {
  hasRuntime: boolean;
  toggleRuntime: (v: boolean) => void;
  themeStore: ReturnType<typeof createThemeStore>;
}) => {
  const { hasRuntime, toggleRuntime, themeStore } = props;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <h1 style={{ margin: 0, flex: 1, textAlign: 'center' }}>
        Jupyter UI ❤️ Lexical
      </h1>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          marginLeft: 'auto',
        }}
      >
        <AppearanceControlsWithStore useStore={themeStore} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Text
            id="runtime-toggle-label"
            sx={{ fontSize: 0, color: 'fg.muted' }}
          >
            Runtime
          </Text>
          <ToggleSwitch
            size="small"
            defaultChecked={hasRuntime}
            onChange={(on: boolean) => toggleRuntime(on)}
            statusLabelPosition="end"
            aria-labelledby="runtime-toggle-label"
          />
        </Box>
      </Box>
    </Box>
  );
};

export const App = () => {
  const getInitialRuntimeState = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const runtimeParam = urlParams.get('runtime');
    if (runtimeParam !== null) {
      return runtimeParam === 'true';
    }
    const stored = localStorage.getItem('hasRuntime');
    return stored !== 'false';
  };

  const [hasRuntime] = useState(getInitialRuntimeState);
  const themeStore = useMemo(
    () =>
      createThemeStore('jupyter-lexical-primer-theme-example', {
        colorMode: 'auto',
        theme: 'matrix',
      }),
    [],
  );

  const toggleRuntime = (newValue: boolean) => {
    localStorage.setItem('hasRuntime', String(newValue));
    const url = new URL(window.location.href);
    url.searchParams.set('runtime', String(newValue));
    window.location.href = url.toString();
  };

  return (
    <LexicalPrimerThemeProvider useStore={themeStore}>
      <div className="App">
        <AppToolbar
          hasRuntime={hasRuntime}
          toggleRuntime={toggleRuntime}
          themeStore={themeStore}
        />
      </div>
      <LexicalProvider>
        <LexicalEditor />
      </LexicalProvider>
      <div className="other App">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <a
            href="https://datalayer.ai"
            target="_blank"
            rel="noreferrer"
            style={{ marginRight: 8 }}
          >
            <ThreeBarsIcon />
          </a>
          <a href="https://datalayer.ai" target="_blank" rel="noreferrer">
            Datalayer, Inc.
          </a>
        </div>
      </div>
    </LexicalPrimerThemeProvider>
  );
};

export default App;
