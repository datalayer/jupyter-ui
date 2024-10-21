/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Box } from '@primer/react';
import { INotebookContent } from '@jupyterlab/nbformat';
import { JupyterReactTheme } from '../theme';
import { ServiceManagerLess } from '../jupyter';
import { Notebook } from '../components/notebook/Notebook';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import { CellSidebar } from '../components/notebook/cell/sidebar/CellSidebar';

import nbformat from './notebooks/NotebookExample1.ipynb.json';

const NotebookLess = () => {
  const [serviceManager, _] = useState(new ServiceManagerLess());
  return (
    <JupyterReactTheme>
      <Box as="h1">A Jupyter Notebook with a Less Service Manager</Box>
      <Notebook
        serverless={true}
        nbformat={nbformat as INotebookContent}
        id="notebook-less-id"
        height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
        cellSidebarMargin={120}
        readonly={true}
        serviceManager={serviceManager}
        CellSidebar={CellSidebar}
        Toolbar={NotebookToolbar}
      />
    </JupyterReactTheme>
  )
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookLess />);
