/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import {
  BaseStyles,
  Button,
  ThemeProvider,
  ToggleSwitch,
  Text,
} from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import { MoonIcon, SunIcon, ThreeBarsIcon } from '@primer/octicons-react';
import { JupyterReactTheme } from '@datalayer/jupyter-react';
import { useLexical, Editor, LexicalProvider, nbformatToLexical } from '..';

type ColorMode = 'day' | 'night' | 'light' | 'dark' | 'auto';

import LEXICAL_MODEL from './content/Example.lexical.json';

import NBFORMAT_MODEL from './content/Example.ipynb.json';

const LexicalEditor = () => {
  const { editor } = useLexical();

  // Load the Lexical model on mount
  useEffect(() => {
    if (editor) {
      // Defer setEditorState to avoid flushSync warning during React render
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
          Load Notebook Model
        </Button>
      </Box>
    </Box>
  );
};

const AppToolbar = (props: {
  hasRuntime: boolean;
  toggleRuntime: (v: boolean) => void;
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
}) => {
  const { hasRuntime, toggleRuntime, colorMode, setColorMode } = props;
  const isDark = colorMode === 'night' || colorMode === 'dark';

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SunIcon size={16} />
          <ToggleSwitch
            size="small"
            defaultChecked={isDark}
            onChange={(on: boolean) => setColorMode(on ? 'night' : 'day')}
            statusLabelPosition="end"
            aria-labelledby="colormode-toggle-label"
          />
          <MoonIcon size={16} />
        </Box>
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
  // Get initial state from URL or localStorage
  const getInitialRuntimeState = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const runtimeParam = urlParams.get('runtime');
    if (runtimeParam !== null) {
      return runtimeParam === 'true';
    }
    const stored = localStorage.getItem('hasRuntime');
    return stored !== 'false';
  };

  const getInitialColorMode = (): ColorMode => {
    const stored = localStorage.getItem('colorMode');
    if (stored === 'day' || stored === 'night') {
      return stored;
    }
    return 'day';
  };

  const [hasRuntime] = useState(getInitialRuntimeState);
  const [colorMode, setColorMode] = useState<ColorMode>(getInitialColorMode);

  const toggleRuntime = (newValue: boolean) => {
    localStorage.setItem('hasRuntime', String(newValue));
    const url = new URL(window.location.href);
    url.searchParams.set('runtime', String(newValue));
    window.location.href = url.toString();
  };

  return (
    <ThemeProvider colorMode={colorMode}>
      <BaseStyles>
        <div className="App">
          <AppToolbar
            hasRuntime={hasRuntime}
            toggleRuntime={toggleRuntime}
            colorMode={colorMode}
            setColorMode={(mode: ColorMode) => {
              localStorage.setItem('colorMode', mode);
              setColorMode(mode);
            }}
          />
        </div>
        <JupyterReactTheme
          colormode={
            colorMode === 'night' || colorMode === 'dark' ? 'dark' : 'light'
          }
        >
          <LexicalProvider>
            <LexicalEditor />
          </LexicalProvider>
        </JupyterReactTheme>
        <div className="other App">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <a href="https://datalayer.ai" target="_blank" rel="noreferrer">
              <ThreeBarsIcon />
            </a>
          </div>
          <h2>
            <a href="https://datalayer.ai" target="_blank" rel="noreferrer">
              Datalayer, Inc.
            </a>
          </h2>
          <ul>
            <li>
              <a
                href="https://github.com/datalayer/jupyter-ui"
                target="_blank"
                rel="noreferrer"
              >
                Jupyter UI
              </a>
            </li>
          </ul>
        </div>
      </BaseStyles>
    </ThemeProvider>
  );
};

export default App;
