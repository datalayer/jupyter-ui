/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { Button } from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import { ThreeBarsIcon } from '@primer/octicons-react';
import { JupyterReactTheme } from '@datalayer/jupyter-react';
import {
  useLexical,
  Editor,
  LexicalProvider,
} from '@datalayer/jupyter-lexical';

import LEXICAL_MODEL from '@datalayer/jupyter-lexical/lib/examples/content/Example.lexical.json';

import NBFORMAT_MODEL from '@datalayer/jupyter-lexical/lib/examples/content/Example.ipynb.json';

const LexicalEditor = () => {
  const { editor } = useLexical();
  return (
    <Box className="center">
      <Box>
        <Editor notebook={NBFORMAT_MODEL} />
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

export const RichEditorMock = () => {
  // Check if we're in a test environment
  const isTestEnvironment =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1') &&
    !window.location.search.includes('kernel=true');

  return (
    <>
      <div className="App">
        <h1>Jupyter UI ❤️ Lexical</h1>
      </div>
      <JupyterReactTheme
      //        startDefaultKernel={!isTestEnvironment}
      //        serverless={isTestEnvironment}
      >
        <LexicalProvider>
          <LexicalEditor />
        </LexicalProvider>
      </JupyterReactTheme>
      <div className="other App">
        <br />
        <a href="https://datalayer.ai" target="_blank" rel="noreferrer">
          <ThreeBarsIcon />
        </a>
        <h2>
          Copyright ©{' '}
          <a href="https://datalayer.ai" target="_blank" rel="noreferrer">
            2022 Datalayer, Inc.
          </a>
        </h2>
        <ul>
          <li>
            <a
              href="https://github.com/datalayer/jupyter-ui/tree/main/packages/lexical"
              target="_blank"
              rel="noreferrer"
            >
              Jupyter UI open-source repository
            </a>
          </li>
        </ul>
      </div>
    </>
  );
};

export default RichEditorMock;
