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

const ObservableHQExample = () => {
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  return (
    <Jupyter defaultKernelName="deno">
      <Notebook
        path="deno/display-js/Observable Plot.ipynb"
        height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
        Toolbar={NotebookToolbar}
        extensions={extensions}
      />
    </Jupyter>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<ObservableHQExample />);
