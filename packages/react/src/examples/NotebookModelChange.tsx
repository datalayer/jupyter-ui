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

import notebook1 from './samples/NotebookExample1.ipynb.json';
import notebook2 from './samples/NotebookExample2.ipynb.json';

const NOTEBOOK_UID = 'notebook-model-change-id';

const NotebookModelChange = () => {
  const { injectableStore } = useJupyter();
  const [model, setModel] = useState<INotebookContent>(notebook1);
  const notebookModel = selectNotebookModel(NOTEBOOK_UID);
  console.log('Notebook Model', notebookModel?.model);
  console.log('Notebook NbFormat', notebookModel?.model?.toJSON() as INotebookContent);
  const changeModel = () => {
    console.log('Notebook NbFormat from store', (injectableStore.getState() as IJupyterReactState).notebook.notebooks.get(NOTEBOOK_UID)?.model?.toJSON() as INotebookContent);
    setModel(notebook2);
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
        height="700px"
        CellSidebar={CellSidebarDefault}
      />
    </>
  );
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <Jupyter>
    <NotebookModelChange />
  </Jupyter>
);
