/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import JupyterLabTheme from '../jupyter/lab/JupyterLabTheme';
import Notebook from '../components/notebook/Notebook';
import NotebookToolbar from './toolbars/NotebookToolbar';
import CellSidebarSource from './sidebars/CellSidebarSource';

import nbformat from './notebooks/NotebookExample1.ipynb.json';

const NotebookCellSidebar = () => (
  <JupyterLabTheme>
    <Notebook
      nbformat={nbformat as INotebookContent}
      id="notebook-sidebar-id"
      height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
      cellSidebarMargin={160}
      CellSidebar={CellSidebarSource}
      Toolbar={NotebookToolbar}
    />
  </JupyterLabTheme>
);

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookCellSidebar />);
