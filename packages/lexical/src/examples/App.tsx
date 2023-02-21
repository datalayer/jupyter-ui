import React from "react";
import { Box, Button } from "@primer/react";
import { ThreeBarsIcon } from "@primer/octicons-react"
import { Jupyter } from "@datalayer/jupyter-react";
import { useLexical, LexicalProvider } from "./context/LexicalContext";
import Editor from "./Editor";

import initialLexicalModel from "./content/Example.lexical.json";
import initialNbformatModel from "./content/Example.ipynb.json";

const LexicalEditor = () => {
  const { editor } = useLexical();
  return (
    <Box className="center">
      <Box>
        <Editor notebook={initialNbformatModel} />
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
    </Box>
  )
}

export default function App() {
  return (
    <>
      <div className="App">
        <h1>Jupyter React ❤️ Lexical</h1>
      </div>
      <Jupyter>
        <LexicalProvider>
          <LexicalEditor/>
        </LexicalProvider>
      </Jupyter>
      <div className="other App">
        <a href="https://datalayer.io" target="_blank">
          <ThreeBarsIcon/>
        </a>
        <h2>
          © <a href="https://datalayer.io" target="_blank">2022 Datalayer, Inc.</a>
        </h2>
        <ul>
          <li>
            <a href="https://github.com/datalayer/jupyter-react/tree/main/packages/lexical" target="_blank">Jupyter Lexical open-source repository</a>
          </li>
        </ul>
      </div>
    </>
  )
}
