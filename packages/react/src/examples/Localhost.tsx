/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Jupyter } from '../jupyter';
import { Notebook } from '../components/notebook/Notebook';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import { CellSidebarButton } from '../components/notebook/cell/sidebar/CellSidebarButton';

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <Jupyter
    jupyterServerUrl="http://localhost:8686/api/jupyter-server"
    jupyterServerToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
    startDefaultKernel
  >
    <Notebook
      path="ipywidgets.ipynb"
      id="notebook-id"
      startDefaultKernel={true}
      height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
      cellSidebarMargin={60}
      CellSidebar={CellSidebarButton}
      Toolbar={NotebookToolbar}
    />
  </Jupyter>
);
