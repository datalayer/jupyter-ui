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
import notebook from './notebooks/IPyWidgetsExample.ipynb.json';

const Dashboard = () => {
  const extensions = useMemo(() => [new CellSidebarExtension()], []);

  return (
    <JupyterReactTheme>
      <Notebook
        nbformat={notebook as INotebookContent}
        id="notebook-id"
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

root.render(<Dashboard />);
