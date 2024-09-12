/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import JupyterReactTheme from '../themes/JupyterReactTheme';
import Notebook from '../components/notebook/Notebook';
import NotebookToolbar from './../components/notebook/toolbar/NotebookToolbar';
import CellSidebarSource from './sidebars/CellSidebarSource';

import nbformat from './notebooks/NotebookExample1.ipynb.json';

const NotebookCellSidebar = () => (
  <JupyterReactTheme>
    <Notebook
      nbformat={nbformat as INotebookContent}
      id="notebook-sidebar-id"
      height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
      cellSidebarMargin={160}
      CellSidebar={CellSidebarSource}
      Toolbar={NotebookToolbar}
    />
  </JupyterReactTheme>
);

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookCellSidebar />);
