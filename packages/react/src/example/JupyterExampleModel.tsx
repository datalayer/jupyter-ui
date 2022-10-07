import { useState } from "react";
import { createRoot } from 'react-dom/client';
import { Box, Button, ButtonGroup } from '@primer/react';
import { INotebookContent } from '@jupyterlab/nbformat';
import Jupyter from '../jupyter/Jupyter';
import Notebook from '../components/notebook/Notebook';
import CellSidebarDefault from '../components/notebook/cell/sidebar/CellSidebarDefault';
import notebookExample1 from './NotebookExample1.ipynb.json';
import notebookExample2 from './NotebookExample2.ipynb.json';

import "./../../style/index.css";

const NOTEBOOK_UID = 'notebook-id-model'

const NotebookModelChange = () => {
  const [model, setModel] = useState<INotebookContent>(notebookExample1);
  const changeModel = () => {
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
        model={model}
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
