/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { CellSidebarExtension } from '../components';
import { CellSidebarButton } from '../components/notebook/cell/sidebar/CellSidebarButton';
import { Notebook } from '../components/notebook/Notebook';
import { JupyterReactTheme } from '../theme';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <JupyterReactTheme>
    <Notebook
      path="ipywidgets.ipynb"
      id="notebook-id"
      startDefaultKernel
      height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
      extensions={[new CellSidebarExtension({ factory: CellSidebarButton })]}
      Toolbar={NotebookToolbar}
    />
  </JupyterReactTheme>
);
