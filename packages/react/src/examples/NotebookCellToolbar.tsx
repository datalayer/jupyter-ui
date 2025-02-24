/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { Notebook } from '../components/notebook/Notebook';
import { CellToolbarExtension } from './extensions';
import { CellSidebarButton } from '../components/notebook/cell/sidebar/CellSidebarButton';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';

import nbformat from './notebooks/NotebookExample1.ipynb.json';

const NotebookCellToolbar = () => {
  const [extension, _] = useState(new CellToolbarExtension());
  return (
    <JupyterReactTheme>
      <Notebook
        startDefaultKernel
        nbformat={nbformat as INotebookContent}
        extensions={[extension]}
        id="notebook-cell-toolbar-id"
        height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
        cellSidebarMargin={160}
        CellSidebar={CellSidebarButton}
        Toolbar={NotebookToolbar}
      />
    </JupyterReactTheme>
  )
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookCellToolbar />);
