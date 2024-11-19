/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Box } from '@primer/react';
import { INotebookContent } from '@jupyterlab/nbformat';
import { JupyterReactTheme } from '../theme';
import { Notebook } from '../components/notebook/Notebook';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import { CellSidebar } from '../components/notebook/cell/sidebar/CellSidebar';

import nbformat from './notebooks/NotebookExample1.ipynb.json';

const NotebookLite = () => (
  <JupyterReactTheme>
    <Box as="h1">A Jupyter Notebook with a Lite Kernel</Box>
    <Notebook
      startDefaultKernel={true}
      lite={true}
      nbformat={nbformat as INotebookContent}
      id="notebook-lite-id"
      height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
      cellSidebarMargin={120}
      CellSidebar={CellSidebar}
      Toolbar={NotebookToolbar}
    />
  </JupyterReactTheme>
);

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookLite />);
