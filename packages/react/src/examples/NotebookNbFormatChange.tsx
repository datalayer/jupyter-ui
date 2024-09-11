/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Box, Button, ButtonGroup } from '@primer/react';
import { INotebookContent } from '@jupyterlab/nbformat';
import JupyterReactTheme from '../themes/JupyterReactTheme';
import Notebook from '../components/notebook/Notebook';
import CellSidebar from '../components/notebook/cell/sidebar/CellSidebar';
import useNotebookStore from '../components/notebook/NotebookState';

import nbformat1 from './notebooks/NotebookExample1.ipynb.json';
import nbformat2 from './notebooks/NotebookExample2.ipynb.json';

const NOTEBOOK_ID = 'notebook-model-change-id';

const NotebookNbFormatChange = () => {
  const notebookStore = useNotebookStore();
  const [nbformat, setNbformat] = useState(nbformat1);
  const changeModel = () => {
    console.log(
      'Notebook NbFormat from store',
      notebookStore.notebooks.get(NOTEBOOK_ID)?.model?.toJSON() as INotebookContent
    );
    nbformat === nbformat1 ? setNbformat(nbformat2) : setNbformat(nbformat1);
  };
  return (
    <>
      <Box display="flex">
        <ButtonGroup>
          <Button variant="default" size="small" onClick={changeModel}>
            Change Model
          </Button>
        </ButtonGroup>
      </Box>
      <Notebook
        id={NOTEBOOK_ID}
        nbformat={nbformat}
        height="700px"
        CellSidebar={CellSidebar}
      />
    </>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <JupyterReactTheme>
    <NotebookNbFormatChange />
  </JupyterReactTheme>
);
