/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Jupyter } from '../jupyter/Jupyter';
import { DEFAULT_JUPYTER_SERVER_URL, DEFAULT_JUPYTER_SERVER_TOKEN } from '../jupyter';
import { Notebook } from '../components/notebook/Notebook';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import { CellSidebarButton } from '../components/notebook/cell/sidebar/CellSidebarButton';

const NOTEBOOK_ID = 'notebook-id';

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <Jupyter
    jupyterServerUrl={DEFAULT_JUPYTER_SERVER_URL}
    jupyterServerToken={DEFAULT_JUPYTER_SERVER_TOKEN}
  >
    <Notebook
      path="ipywidgets.ipynb"
      id={NOTEBOOK_ID}
      height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
      cellSidebarMargin={60}
      CellSidebar={CellSidebarButton}
      Toolbar={NotebookToolbar}
    />
  </Jupyter>
);
