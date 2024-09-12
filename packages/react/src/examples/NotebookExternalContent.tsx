/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Box, IconButton } from '@primer/react';
import { ZapIcon } from '@primer/octicons-react';
import { INotebookContent } from '@jupyterlab/nbformat';
import { JupyterReactTheme } from '../themes/JupyterReactTheme';
import { Notebook } from '../components/notebook/Notebook';
import { CellSidebar } from '../components/notebook/cell/sidebar/CellSidebar';
import { notebookStore } from '../components/notebook/NotebookState';

import notebook from './notebooks/NotebookExample1.ipynb.json';

const NOTEBOOK_ID = 'notebook-model-id';

const NotebookExternalContent = () => {
  const [nbformat, setNbformat] = useState<INotebookContent>();
  const [updatedNbFormat, setUpdatedNbFormat] = useState<INotebookContent>();
  const model = notebookStore.getState().selectNotebookModel(NOTEBOOK_ID)?.model;
  useEffect(() => {
    // Set nbformat with any content.
    // This may come from an external storage that you fetch in this react effect.
    setNbformat(notebook);
  }, []);
  useEffect(() => {
    if (model) {
      model.contentChanged.connect(model => {
        const n = model.toJSON() as INotebookContent;
        setUpdatedNbFormat(n);
      });
    }
  }, [model]);
  const saveNotebook = () => {
    // Do whatever you want with the updated notebook
    // You may persist it to an external storage that a call to an API.
    alert('Save this notebook: ' + JSON.stringify(updatedNbFormat));
  };
  return nbformat ? (
    <>
      <Box>
        <IconButton
          variant="invisible"
          size="small"
          color="primary"
          aria-label="Save"
          title="Save"
          onClick={e => {
            e.preventDefault();
            saveNotebook();
          }}
          icon={ZapIcon}
        />
      </Box>
      <Notebook
        nbformat={nbformat}
        id={NOTEBOOK_ID}
        height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
        cellSidebarMargin={120}
        CellSidebar={CellSidebar}
      />
    </>
  ) : (
    <></>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <JupyterReactTheme>
    <NotebookExternalContent />
  </JupyterReactTheme>
);
