import { useState } from "react";
import { createRoot } from 'react-dom/client';
import { Box, Button, ButtonGroup } from '@primer/react';
import { INotebookContent } from '@jupyterlab/nbformat';
import Jupyter from '../jupyter/Jupyter';
import { useJupyter } from '../jupyter/JupyterContext';
import { IJupyterReactState } from '../redux/State';
import Notebook from '../components/notebook/Notebook';
import { selectNotebookModel } from '../components/notebook/NotebookState';
import CellSidebarDefault from '../components/notebook/cell/sidebar/CellSidebarDefault';

import notebookExample1 from './notebooks/NotebookExample1.ipynb.json';
import notebookExample2 from './notebooks/NotebookExample2.ipynb.json';

import "./../../style/index.css";

const NOTEBOOK_UID = 'notebook-model-id';

const NotebookModelChange = () => {
  const { injectableStore } = useJupyter();
  const [model, setModel] = useState<INotebookContent>(notebookExample1);
  const notebookModel = selectNotebookModel(NOTEBOOK_UID);
  console.log('Current notebook model update', notebookModel?.model, notebookModel?.model?.toJSON());
  const changeModel = () => {
    console.log('Current notebook model from store', (injectableStore.getState() as IJupyterReactState).notebook.notebooks.get(NOTEBOOK_UID)?.model?.toJSON());
    setModel(notebookExample2);
  }
  return (
    <>
      <Box display="flex">
        <ButtonGroup>
          <Button
            variant="default"
            size="small"
            onClick={changeModel}
            >
            Change Model
          </Button>
        </ButtonGroup>
      </Box>
      <Notebook
        uid={NOTEBOOK_UID}
        nbformat={model}
        CellSidebar={CellSidebarDefault}
        height="700px"
      />
    </>
  );
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <Jupyter lite={false} terminals={true}>
    <NotebookModelChange />
  </Jupyter>
);
