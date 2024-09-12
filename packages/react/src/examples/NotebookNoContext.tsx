/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { JupyterReactTheme } from '../themes/JupyterReactTheme';
import Notebook from '../components/notebook/Notebook';
import NotebookToolbar from './../components/notebook/toolbar/NotebookToolbar';
import CellSidebar from '../components/notebook/cell/sidebar/CellSidebarButton';

const NOTEBOOK_ID = 'notebook-id';

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

const colorMode = 'light';

root.render(
  <JupyterReactTheme colorMode={colorMode}>
    <Notebook
      path="ipywidgets.ipynb"
      id={NOTEBOOK_ID}
      height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
      cellSidebarMargin={60}
      CellSidebar={CellSidebar}
      Toolbar={NotebookToolbar}
    />
  </JupyterReactTheme>
);
