/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { Box } from '@datalayer/primer-addons';
import { ServiceManagerLess } from '../jupyter';
import { JupyterReactTheme } from '../theme';
import { Notebook2 } from '../components/notebook/Notebook2';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import { CellSidebarExtension } from '../components';

import NBFORMAT from './notebooks/NotebookExample1.ipynb.json';

const NotebookLessExample = () => {
  const serviceManager = useMemo(() => new ServiceManagerLess(), []);
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  return (
    <JupyterReactTheme>
      <Box as="h1">Notebook with a Less Service Manager</Box>
      {serviceManager && (
        <Notebook2
          // serverless
          nbformat={NBFORMAT as INotebookContent}
          id="notebook-less-id"
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          readonly
          serviceManager={serviceManager}
          extensions={extensions}
          Toolbar={NotebookToolbar}
        />
      )}
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookLessExample />);
