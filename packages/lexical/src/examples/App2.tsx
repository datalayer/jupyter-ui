/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React, { useState } from "react";
import { Box, TabNav, Button } from "@primer/react";
import { ThreeBarsIcon } from "@primer/octicons-react"
import { JSONTree } from "react-json-tree";
import { $getRoot } from "lexical";
import styled from "styled-components";
import { INotebookContent } from "@jupyterlab/nbformat";
import { INotebookModel } from "@jupyterlab/notebook";
import { Jupyter, Notebook, CellSidebar, useNotebookStore } from "@datalayer/jupyter-react";
import { lexicalToNbFormat } from "./../convert/LexicalToNbFormat";
import { useLexical, LexicalProvider } from "./context/LexicalContext";
import Editor from "./editor/Editor";

import initialLexicalModel from "./content/Example.lexical.json";
import initialNbformatModel from "./content/Example.ipynb.json";

type TabType = 'editor' | 'notebook' | 'nbformat';

const StyledNotebook = styled.div`
  &[style] {
    height: 100vh !important;
  }
`

const NOTEBOOK_UID = 'notebook-uid-lexical';

const Tabs = () => {
  const { editor } = useLexical();
  const notebookStore = useNotebookStore();
  const [tab, setTab] = useState<TabType>('editor');
  const [notebookContent, setNotebookContent] = useState<INotebookContent>(initialNbformatModel);
  const notebook = notebookStore.selectNotebook(NOTEBOOK_UID);
  const goToTab = (e: any, toTab: TabType, notebookModel: INotebookModel | undefined) => {
    e.preventDefault();
    if (tab === 'notebook' && toTab === 'editor') {
      if (notebookModel && editor) {
        setNotebookContent(notebookModel.toJSON() as INotebookContent);
      }
    }
    if (tab === 'editor' && toTab === "notebook") {
      editor?.update(() => {
        const root = $getRoot();
        const children = root.getChildren();
        const nb = lexicalToNbFormat(children);
        setNotebookContent(nb);
      });
    }
    if (tab === 'notebook' && toTab === 'nbformat') {
      if (notebookModel && editor) {
        setNotebookContent(notebookModel.toJSON() as INotebookContent);
      }
    }
    setTab(toTab);
  }
  return (
    <Box className="center">
      <TabNav>
        <TabNav.Link href="" selected={tab === 'editor'} onClick={e => goToTab(e, 'editor', notebook?.model)}>
          Editor
        </TabNav.Link>
        <TabNav.Link href="" selected={tab === 'notebook'} onClick={e => goToTab(e, 'notebook', notebook?.model)}>
          Notebook
        </TabNav.Link>
        <TabNav.Link href="" selected={tab === 'nbformat'} onClick={e => goToTab(e, 'nbformat', notebook?.model)}>
          NbFormat
        </TabNav.Link>
      </TabNav>
      { tab === 'editor' &&
        <Box>
          <Editor notebook={notebookContent} />
          <Button
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              if (editor) {
                const editorState = editor.parseEditorState(initialLexicalModel as any);
                editor.setEditorState(editorState);  
              }
            }}>
              Load Lexical Model
          </Button>
        </Box>
      }
      { tab === 'notebook' &&
        <StyledNotebook>
          <Box mb={3}>
            <Notebook
              id={NOTEBOOK_UID}
              nbformat={notebookContent}
              CellSidebar={CellSidebar}
            />
            <Button
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                setNotebookContent(initialNbformatModel);
              }}>
                Reset Nbformat
            </Button>
          </Box>
        </StyledNotebook>
      }
      { tab === 'nbformat' &&
        <Box>
          <JSONTree data={notebookContent}/>;
        </Box>
      }
    </Box>
  )
}

export default function App() {
  return (
    <>
      <div className="App">
        <h1>Jupyter UI ❤️ Lexical</h1>
      </div>
      <Jupyter startDefaultKernel={true}>
        <LexicalProvider>
          <Tabs/>
        </LexicalProvider>
      </Jupyter>
      <div className="other App">
        <a href="https://datalayer.io" target="_blank">
          <ThreeBarsIcon/>
        </a>
        <h2>
          copyright © <a href="https://datalayer.io" target="_blank">2022-2024 Datalayer, Inc.</a>
        </h2>
        <ul>
          <li>
            <a href="https://github.com/datalayer/jupyter-ui" target="_blank">Jupyter UI open-source repository</a>
          </li>
        </ul>
      </div>
    </>
  )
}
