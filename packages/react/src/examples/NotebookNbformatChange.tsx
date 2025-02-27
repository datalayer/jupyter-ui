/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { INotebookContent } from '@jupyterlab/nbformat';
import { Box, Button, ButtonGroup } from '@primer/react';
import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CellSidebarExtension } from '../components';
import { Notebook } from '../components/notebook/Notebook';
import useNotebookStore from '../components/notebook/NotebookState';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import nbformat1 from './notebooks/NotebookExample1.ipynb.json';
import nbformat2 from './notebooks/NotebookExample2.ipynb.json';

const NOTEBOOK_ID = 'notebook-model-change-id';

const NotebookNbformatChange = () => {
  const notebookStore = useNotebookStore();
  const [nbformat, setNbformat] = useState(nbformat1);
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  const changeNbformat = () => {
    console.log(
      'Notebook Nbformat from store',
      notebookStore.notebooks
        .get(NOTEBOOK_ID)
        ?.model?.toJSON() as INotebookContent
    );
    nbformat === nbformat1 ? setNbformat(nbformat2) : setNbformat(nbformat1);
  };
  return (
    <>
      <Box display="flex">
        <ButtonGroup>
          <Button variant="default" size="small" onClick={changeNbformat}>
            Change Nbformat
          </Button>
        </ButtonGroup>
      </Box>
      <Notebook
        id={NOTEBOOK_ID}
        nbformat={nbformat}
        height="700px"
        extensions={extensions}
      />
    </>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <JupyterReactTheme>
    <NotebookNbformatChange />
  </JupyterReactTheme>
);
