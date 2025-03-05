/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { INotebookContent } from '@jupyterlab/nbformat';
import { createRoot } from 'react-dom/client';
import { CellSidebarExtension } from '../components';
import { Notebook } from '../components/notebook/Notebook';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import nbformat from './notebooks/NotebookExample1.ipynb.json';
import CellSidebarSource from './extensions/cellsidebars/CellSidebarSource';

const NotebookCellSidebar = () => (
  <JupyterReactTheme>
    <Notebook
      nbformat={nbformat as INotebookContent}
      id="notebook-cell-sidebar-id"
      height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
      cellSidebarMargin={160}
      extensions={[new CellSidebarExtension({ factory: CellSidebarSource })]}
      Toolbar={NotebookToolbar}
    />
  </JupyterReactTheme>
);

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookCellSidebar />);
