import { useState } from "react";
import { createRoot } from 'react-dom/client';
import { Box, Button, ButtonGroup } from '@primer/react';
import { INotebookContent } from '@jupyterlab/nbformat';
import Jupyter from '../jupyter/Jupyter';
import { useJupyter } from '../jupyter/JupyterContext';
import { IJupyterReactState } from '../state/redux/State';
import Notebook from '../components/notebook/Notebook';
import CellSidebarDefault from '../components/notebook/cell/sidebar/CellSidebarDefault';
// import { selectNotebookModel } from '../components/notebook/NotebookState';

import nbformat1 from './notebooks/NotebookExample1.ipynb.json';
import nbformat2 from './notebooks/NotebookExample2.ipynb.json';

const NOTEBOOK_UID = 'notebook-model-change-id';

const NotebookModelChange = () => {
  const { injectableStore } = useJupyter();
  const [nbformat, setNbformat] = useState(nbformat1);
//  const notebookModel = selectNotebookModel(NOTEBOOK_UID);
//  console.log('Notebook Model', notebookModel?.model);
//  console.log('Notebook Model NbFormat', notebookModel?.model?.toJSON() as INotebookContent);
  const changeModel = () => {
    console.log('Notebook NbFormat from store', (injectableStore.getState() as IJupyterReactState).notebook.notebooks.get(NOTEBOOK_UID)?.model?.toJSON() as INotebookContent);
    nbformat === nbformat1
    ? setNbformat(nbformat2)
    : setNbformat(nbformat1);
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
        nbformat={nbformat}
        height="700px"
        externalIPyWidgets={[
          { name: "@widgetti/jupyter-react", version: "0.3.0" },
          { name: "bqplot", version: "0.5.42" },
          { name: "jupyter-matplotlib", version: "0.11.3" },
        ]}
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
