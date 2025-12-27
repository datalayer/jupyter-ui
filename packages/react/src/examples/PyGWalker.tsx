/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { INotebookContent } from '@jupyterlab/nbformat';
import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { CellSidebarExtension } from '../components';
import { Notebook } from '../components/notebook/Notebook';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';

import NBFORMAT from './notebooks/PyGWalker.ipynb.json';

const PyGWalkerExample = () => {
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  return (
    <JupyterReactTheme>
      <Notebook
        id="notebook-pygwalker-id"
        startDefaultKernel
        nbformat={NBFORMAT as INotebookContent}
        height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
        extensions={extensions}
        Toolbar={NotebookToolbar}
      />
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<PyGWalkerExample />);
