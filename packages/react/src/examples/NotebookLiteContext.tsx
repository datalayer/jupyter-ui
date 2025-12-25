/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { Box } from '@datalayer/primer-addons';
import { CellSidebarExtension } from '../components';
import { Notebook } from '../components/notebook/Notebook';
import { Jupyter } from '../jupyter/Jupyter';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';

import NBFORMAT from './notebooks/NotebookExample1.ipynb.json';

const NotebookLite = () => {
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  return (
    <Jupyter lite>
      <Box as="h1">Notebook with a Lite Kernel (with a Jupyter Context)</Box>
      <Notebook
        nbformat={NBFORMAT as INotebookContent}
        id="notebook-lite-context-id"
        height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
        extensions={extensions}
        Toolbar={NotebookToolbar}
      />
    </Jupyter>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookLite />);
