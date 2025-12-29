/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useMemo } from 'react';
import { $getRoot } from 'lexical';
import styled from 'styled-components';
import {
  lexicalToNbformat,
  useLexical,
  LexicalProvider,
  Editor,
} from '@datalayer/jupyter-lexical';
import {
  useNotebookStore,
  useJupyter,
  JupyterReactTheme,
  Notebook,
  CellSidebar,
  CellSidebarExtension,
} from '@datalayer/jupyter-react';
import { Button, UnderlineNav } from '@primer/react';
import { ThreeBarsIcon } from '@primer/octicons-react';
import { Box } from '@datalayer/primer-addons';
import { JSONTree } from 'react-json-tree';
import { INotebookContent } from '@jupyterlab/nbformat';
import { INotebookModel } from '@jupyterlab/notebook';

import './../style/index.css';

import '@datalayer/jupyter-lexical/style/index.css';

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
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const notebookStore = useNotebookStore();
  const [tab, setTab] = useState<TabType>('editor');
  const [notebookContent, setNotebookContent] = useState<INotebookContent>(
    INITIAL_NBFORMAT_MODEL,
  );
  const extensions = useMemo(
    () => [new CellSidebarExtension({ factory: CellSidebar })],
    [],
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
        setNotebookContent(notebookModel.toJSON() as INotebookContent);
      }
    }
    if (tab === 'editor' && toTab === 'notebook') {
      editor?.update(() => {
        const root = $getRoot();
        const children = root.getChildren();
        const nb = lexicalToNbformat(children);
        setNotebookContent(nb);
      });
    }
    if (tab === 'notebook' && toTab === 'nbformat') {
      if (notebookModel && editor) {
        setNotebookContent(notebookModel.toJSON() as INotebookContent);
      }
    }
    setTab(toTab);
  };
  return (
    <Box className="center">
      <UnderlineNav aria-label="Underline navigation">
        <UnderlineNav.Item
          href=""
          aria-current={tab === 'editor' ? 'page' : undefined}
          onClick={(e: any) => goToTab(e, 'editor', notebook?.model)}
        >
          Editor
        </UnderlineNav.Item>
        <UnderlineNav.Item
          href=""
          aria-current={tab === 'notebook' ? 'page' : undefined}
          onClick={(e: any) => goToTab(e, 'notebook', notebook?.model)}
        >
          Notebook
        </UnderlineNav.Item>
        <UnderlineNav.Item
          href=""
          aria-current={tab === 'nbformat' ? 'page' : undefined}
          onClick={(e: any) => goToTab(e, 'nbformat', notebook?.model)}
        >
          NbFormat
        </UnderlineNav.Item>
      </UnderlineNav>
      {tab === 'editor' && (
        <Box>
          <Editor notebook={notebookContent} />
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
            {serviceManager && defaultKernel && (
              <Notebook
                id={NOTEBOOK_UID}
                kernel={defaultKernel}
                serviceManager={serviceManager}
                nbformat={notebookContent}
                extensions={extensions}
              />
            )}
            <Button
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                setNotebookContent(INITIAL_NBFORMAT_MODEL);
              }}
            >
              Reset Nbformat
            </Button>
          </Box>
        </StyledNotebook>
      )}
      {tab === 'nbformat' && (
        <Box>
          <JSONTree data={notebookContent} />;
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
      <JupyterReactTheme>
        <LexicalProvider>
          <Tabs />
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
