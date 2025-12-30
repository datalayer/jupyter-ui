/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { Button, ButtonGroup } from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import { ThreeBarsIcon } from '@primer/octicons-react';
import { JupyterReactTheme } from '@datalayer/jupyter-react';
import { useLexical, Editor, LexicalProvider } from '..';

import LEXICAL_MODEL from './content/Example.lexical.json';

import NBFORMAT_MODEL from './content/Example.ipynb.json';

const LexicalEditor = () => {
  const { editor } = useLexical();
  return (
    <Box className="center">
      <Box>
        <Editor
          notebook={NBFORMAT_MODEL}
          onSessionConnection={session => {
            console.log('Session changed:', session);
          }}
        />
        <Button
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            if (editor) {
              const editorState = editor.parseEditorState(LEXICAL_MODEL as any);
              editor.setEditorState(editorState);
            }
          }}
        >
          Load Lexical Model
        </Button>
      </Box>
    </Box>
  );
};

export const AppSimple = () => {
  // Get initial state from URL or localStorage
  const getInitialKernelState = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const kernelParam = urlParams.get('kernel');
    if (kernelParam !== null) {
      return kernelParam === 'true';
    }
    const stored = localStorage.getItem('hasKernel');
    return stored === 'true';
  };

  const [hasKernel] = useState(getInitialKernelState);

  const toggleKernel = (newValue: boolean) => {
    localStorage.setItem('hasKernel', String(newValue));
    const url = new URL(window.location.href);
    url.searchParams.set('kernel', String(newValue));
    window.location.href = url.toString();
  };

  return (
    <>
      <div className="App">
        <h1>Jupyter UI ❤️ Lexical</h1>
        <ButtonGroup>
          <Button
            variant={!hasKernel ? 'primary' : 'default'}
            onClick={() => toggleKernel(false)}
            sx={{
              fontWeight: !hasKernel ? 'bold' : 'normal',
              backgroundColor: !hasKernel ? '#0969da' : 'transparent',
              color: !hasKernel ? 'white' : 'inherit',
              '&:hover': {
                backgroundColor: !hasKernel ? '#0860ca' : '#f3f4f6',
              },
            }}
          >
            Without Runtime
          </Button>
          <Button
            variant={hasKernel ? 'primary' : 'default'}
            onClick={() => toggleKernel(true)}
            sx={{
              fontWeight: hasKernel ? 'bold' : 'normal',
              backgroundColor: hasKernel ? '#0969da' : 'transparent',
              color: hasKernel ? 'white' : 'inherit',
              '&:hover': {
                backgroundColor: hasKernel ? '#0860ca' : '#f3f4f6',
              },
            }}
          >
            With Runtime
          </Button>
        </ButtonGroup>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          Current mode:{' '}
          <strong>{hasKernel ? 'Runtime Connected' : 'No Runtime'}</strong>
        </p>
      </div>
      <JupyterReactTheme>
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
    </>
  );
};

export default AppSimple;
