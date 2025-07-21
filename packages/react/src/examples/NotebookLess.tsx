/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { INotebookContent } from '@jupyterlab/nbformat';
import { Box } from '@primer/react';
import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Notebook } from '../components/notebook/Notebook';
import { ServiceManagerLess } from '../jupyter';
import { JupyterReactTheme } from '../theme';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';

import { CellSidebarExtension } from '../components';
import nbformat from './notebooks/NotebookExample1.ipynb.json';

const NotebookLess = () => {
  const serviceManager = useMemo(() => new ServiceManagerLess(), []);
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  return (
    <JupyterReactTheme>
      <Box as="h1">A Jupyter Notebook with a Less Service Manager</Box>
      <Notebook
        serverless
        nbformat={nbformat as INotebookContent}
        id="notebook-less-id"
        height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
        readonly
        serviceManager={serviceManager}
        extensions={extensions}
        Toolbar={NotebookToolbar}
      />
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookLess />);
