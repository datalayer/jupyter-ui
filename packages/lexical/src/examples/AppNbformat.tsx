/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { $getRoot } from 'lexical';
import styled from 'styled-components';
import {
  useNotebookStore,
  Jupyter,
  Notebook,
  CellSidebar,
  CellSidebarExtension,
} from '@datalayer/jupyter-react';
import { Box, UnderlineNav, Button } from '@primer/react';
import { ThreeBarsIcon } from '@primer/octicons-react';
import { JSONTree } from 'react-json-tree';
import { INotebookContent } from '@jupyterlab/nbformat';
import { INotebookModel } from '@jupyterlab/notebook';
import { lexicalToNbformat, useLexical, LexicalProvider, Editor } from './..';

import INITIAL_LEXICAL_MODEL from './content/Example.lexical.json';

import INITIAL_NBFORMAT_MODEL from './content/Example.ipynb.json';

const NOTEBOOK_UID = 'notebook-uid-lexical';

type TabType = 'editor' | 'notebook' | 'nbformat';

const StyledNotebook = styled.div`
  &[style] {
    height: 100vh !important;
  }
`;

const Tabs = () => {
  const { editor } = useLexical();
  const notebookStore = useNotebookStore();
  const [tab, setTab] = useState<TabType>('editor');
  const [nbformat, setNbformat] = useState<INotebookContent>(
    INITIAL_NBFORMAT_MODEL,
  );
  const notebook = notebookStore.selectNotebook(NOTEBOOK_UID);
  const goToTab = (
    e: any,
    toTab: TabType,
    notebookModel: INotebookModel | undefined,
  ) => {
    e.preventDefault();
    if (tab === 'notebook' && toTab === 'editor') {
      if (notebookModel && editor) {
        setNbformat(notebookModel.toJSON() as INotebookContent);
      }
    }
    if (tab === 'editor' && toTab === 'notebook') {
      editor?.update(() => {
        const root = $getRoot();
        const children = root.getChildren();
        const nbformat = lexicalToNbformat(children);
        setNbformat(nbformat);
      });
    }
    if (tab === 'notebook' && toTab === 'nbformat') {
      if (notebookModel && editor) {
        setNbformat(notebookModel.toJSON() as INotebookContent);
      }
    }
    setTab(toTab);
  };
  return (
    <Box className="center">
      <UnderlineNav aria-label="Underline Navigation">
        <UnderlineNav.Item
          href=""
          aria-current={tab === 'editor' ? 'page' : undefined}
          onClick={e => goToTab(e, 'editor', notebook?.model)}
        >
          Editor
        </UnderlineNav.Item>
        <UnderlineNav.Item
          href=""
          aria-current={tab === 'notebook' ? 'page' : undefined}
          onClick={e => goToTab(e, 'notebook', notebook?.model)}
        >
          Notebook
        </UnderlineNav.Item>
        <UnderlineNav.Item
          href=""
          aria-current={tab === 'nbformat' ? 'page' : undefined}
          onClick={e => goToTab(e, 'nbformat', notebook?.model)}
        >
          NbFormat
        </UnderlineNav.Item>
      </UnderlineNav>
      {tab === 'editor' && (
        <Box>
          <Editor notebook={nbformat} />
          <Button
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              if (editor) {
                const editorState = editor.parseEditorState(
                  INITIAL_LEXICAL_MODEL as any,
                );
                editor.setEditorState(editorState);
              }
            }}
          >
            Load Lexical Model
          </Button>
        </Box>
      )}
      {tab === 'notebook' && (
        <StyledNotebook>
          <Box mb={3}>
            <Notebook
              id={NOTEBOOK_UID}
              nbformat={INITIAL_NBFORMAT_MODEL}
              extensions={[new CellSidebarExtension({ factory: CellSidebar })]}
            />
            <Button
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                setNbformat(INITIAL_NBFORMAT_MODEL);
              }}
            >
              Reset Nbformat
            </Button>
          </Box>
        </StyledNotebook>
      )}
      {tab === 'nbformat' && (
        <Box>
          <JSONTree data={nbformat} />;
        </Box>
      )}
    </Box>
  );
};

export function AppNbformat() {
  return (
    <>
      <div className="App">
        <h1>Jupyter UI ❤️ Lexical</h1>
      </div>
      <Jupyter startDefaultKernel>
        <LexicalProvider>
          <Tabs />
        </LexicalProvider>
      </Jupyter>
      <div className="other App">
        {/* Tailwind v4 Button - Using Tailwind Utility Classes */}
        <div className="flex flex-col items-center gap-4 my-8">
          <button
            className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-300 ease-in-out"
            onClick={() => alert('Tailwind CSS v4 is working correctly!')}
          >
            Tailwind v4 Button
          </button>
          {/* Custom class from tailwind.css */}
          <div className="mt-4 text-center">
            <span className="tailwind-demo-badge">
              Tailwind v4 Custom Component
            </span>
          </div>
        </div>
        <br />
        <a href="https://datalayer.io" target="_blank" rel="noreferrer">
          <ThreeBarsIcon />
        </a>
        <h2>
          copyright ©{' '}
          <a href="https://datalayer.io" target="_blank" rel="noreferrer">
            2022-2024 Datalayer, Inc.
          </a>
        </h2>
        <ul>
          <li>
            <a
              href="https://github.com/datalayer/jupyter-ui"
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
}

export default AppNbformat;
