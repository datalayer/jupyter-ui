/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React from "react";
import { Box, Button } from "@primer/react";
import { ThreeBarsIcon } from "@primer/octicons-react"
import { Jupyter } from "@datalayer/jupyter-react";
import { useLexical, Editor, LexicalProvider } from "..";

import INITIAL_LEXICAL_MODEL from "./content/Example.lexical.json";

import INITIAL_NBFORMAT_MODEL from "./content/Example.ipynb.json";

const LexicalEditor = () => {
  const { editor } = useLexical();
  return (
    <Box className="center">
      <Box>
        <Editor notebook={INITIAL_NBFORMAT_MODEL} />
        <Button
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            if (editor) {
              const editorState = editor.parseEditorState(INITIAL_LEXICAL_MODEL as any);
              editor.setEditorState(editorState);  
            }
          }}>
            Load Lexical Model
        </Button>
      </Box>
    </Box>
  )
}

export const App = () => {
  return (
    <>
      <div className="App">
        <h1>Jupyter UI ❤️ Lexical</h1>
      </div>
      <Jupyter startDefaultKernel>
        <LexicalProvider>
          <LexicalEditor/>
        </LexicalProvider>
      </Jupyter>
      <div className="other App">
        <a href="https://datalayer.io" target="_blank">
          <ThreeBarsIcon/>
        </a>
        <h2>
        Copyright © <a href="https://datalayer.io" target="_blank">2022-2024 Datalayer, Inc.</a>
        </h2>
        <ul>
          <li>
            <a href="https://github.com/datalayer/jupyter-ui/tree/main/packages/lexical" target="_blank">Jupyter UI open-source repository</a>
          </li>
        </ul>
      </div>
    </>
  )
}

export default App;
