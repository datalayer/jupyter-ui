/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { CellSidebarExtension } from '../components';
import { Notebook } from '../components/notebook/Notebook';
import { Jupyter } from '../jupyter/Jupyter';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';

const Deno = () => {
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  return (
    <Jupyter defaultKernelName="deno">
      <Notebook
        url="https://raw.githubusercontent.com/rgbkrk/denotebooks/f173b472ad5b0169d77818027bf662682c5024ec/10.2_Polar%20DataFrames.ipynb"
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

root.render(<Deno />);
