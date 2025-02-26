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
import { Jupyter } from '../jupyter/Jupyter';
import { JupyterLabCss } from '../theme';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import notebook from './notebooks/Matplotlib.ipynb.json';

const Matplotlib = () => {
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  return (
    <Jupyter disableCssLoading>
      <JupyterLabCss colormode="light" />
      <Notebook
        nbformat={notebook as INotebookContent}
        id="notebook-matplotlib-id"
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

root.render(<Matplotlib />);
