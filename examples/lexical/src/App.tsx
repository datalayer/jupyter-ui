import React, { useState } from "react";
import { Box, TabNav, Button } from "@primer/react";
import { ThreeBarsIcon } from "@primer/octicons-react"
import { INotebookContent } from "@jupyterlab/nbformat";
import { Jupyter, Notebook, CellSidebarDefault, selectNotebook } from "@datalayer/jupyter-react";
import { JSONTree } from "react-json-tree";
import Editor from "./Editor";
import { $getRoot, $createNodeSelection } from "lexical";
import { lexicalToNbFormat } from "@datalayer/jupyter-lexical";
import { LexicalProvider } from "./context/LexicalContext";
import { useLexical } from "./context/LexicalContext";

import initialLexicalModel from "./content/Example.lexical.json";
import initialNbformatModel from "./content/Example.ipynb.json";

type TabType = 'editor' | 'notebook' | 'nbformat';

const Tabs = () => {
  const { editor } = useLexical();
  const [tab, setTab] = useState<TabType>('editor');
  const [uid, setUid] = useState(0);
  const [notebookModel, setNotebookModel] = useState<INotebookContent>(initialNbformatModel);
  const notebook = selectNotebook();
  const goToTab = (e: any, toTab: TabType) => {
    e.preventDefault();
    if (tab == "notebook" && notebook.model) {
      setNotebookModel(notebook.model.toJSON() as INotebookContent);
    }
    if (tab == "editor") {
      editor?.update(() => {
        const root = $getRoot();
        const children = root.getChildren();
        const nb = lexicalToNbFormat(children);
        setNotebookModel(nb);
      })
    }
    setTab(toTab);
  }
  return (
    <Box className="center">
      <TabNav>
        <TabNav.Link href="" selected={tab === 'editor'} onClick={e => goToTab(e, 'editor')}>
          Editor
        </TabNav.Link>
        <TabNav.Link href="" selected={tab === 'notebook'} onClick={e => goToTab(e, 'notebook')}>
          Notebook
        </TabNav.Link>
        <TabNav.Link href="" selected={tab === 'nbformat'} onClick={e => goToTab(e, 'nbformat')}>
          NbFormat
        </TabNav.Link>
      </TabNav>
      { tab === 'editor' &&
        <Box>
          <Editor notebook={notebookModel}/>
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
        <Box mb={3}>
          <Notebook
            uid={String(uid)}
            path=""
            model={notebookModel}
            CellSidebar={CellSidebarDefault}
            />
          <Button
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              setUid(uid+1);
              setNotebookModel(initialNbformatModel);
            }}>
              Reset Nbformat
          </Button>
        </Box>
      }
      { tab === 'nbformat' &&
        <Box>
          <JSONTree data={notebookModel} />;
        </Box>
      }
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
          <Tabs/>
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
            <a href="https://github.com/datalayer/jupyter-react" target="_blank">Jupyter React open-source repository</a>
          </li>
        </ul>
      </div>
    </>
  );
}
