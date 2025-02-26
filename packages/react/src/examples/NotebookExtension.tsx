/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { INotebookContent } from '@jupyterlab/nbformat';
import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { CellSidebarButton } from '../components/notebook/cell/sidebar/CellSidebarButton';
import { Notebook } from '../components/notebook/Notebook';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import { ExecTimeExtension } from './extensions';

import { CellSidebarExtension } from '../components';
import nbformat from './notebooks/NotebookExample1.ipynb.json';

const NotebookExtension = () => {
  const extensions = useMemo(
    () => [
      new ExecTimeExtension(),
      new CellSidebarExtension({ factory: CellSidebarButton }),
    ],
    []
  );
  return (
    <JupyterReactTheme>
      <Notebook
        nbformat={nbformat as INotebookContent}
        extensions={extensions}
        id="notebook-extension-id"
        height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
        Toolbar={NotebookToolbar}
      />
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookExtension />);
