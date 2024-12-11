/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Text } from '@primer/react';
import { Jupyter, useJupyter } from '../jupyter';
import { JupyterReactTheme } from '../theme';
import { Notebook } from '../components/notebook/Notebook';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import { CellSidebarButton } from '../components/notebook/cell/sidebar/CellSidebarButton';

const NotebookJupyter = () => (
  <Jupyter
    jupyterServerUrl="http://localhost:8686/api/jupyter-server"
    jupyterServerToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
    startDefaultKernel
  >
    <Notebook
      path="ipywidgets.ipynb"
      id="notebook-jupyter-id"
      height="calc(100vh - 250px)" // (Height - Toolbar Height).
      cellSidebarMargin={60}
      CellSidebar={CellSidebarButton}
      Toolbar={NotebookToolbar}
    />
  </Jupyter>
)

const NotebookJupyterReactTheme = () => {
  useJupyter({
    jupyterServerUrl: "http://localhost:8686/api/jupyter-server",
    jupyterServerToken: "60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6",
  })
  return (
    <JupyterReactTheme>
      <Notebook
        startDefaultKernel
        path="ipywidgets.ipynb"
        id="notebook-jupyter-react-themeid"
        height="calc(100vh - 250px)" // (Height - Toolbar Height).
        cellSidebarMargin={60}
        CellSidebar={CellSidebarButton}
        Toolbar={NotebookToolbar}
      />
    </JupyterReactTheme>
  );
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <>
    <Text as="h1">Local Jupyter Server (with a Jupyter Context)</Text>
    <NotebookJupyter/>
    <Text as="h1">Local Jupyter Server (with a Jupyter React Theme)</Text>
    <NotebookJupyterReactTheme/>
  </>
);
