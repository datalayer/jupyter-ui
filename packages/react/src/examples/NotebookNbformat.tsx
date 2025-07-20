/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { INotebookContent } from '@jupyterlab/nbformat';
import { createRoot } from 'react-dom/client';
import { useJupyter } from '../jupyter';
import { Notebook2, CellSidebarExtension, NotebookToolbar } from '../components';
import { JupyterReactTheme } from '../theme';

import nbformat from './notebooks/NotebookExample1.ipynb.json';

const NotebookNbformat = () => {
  const { serviceManager } = useJupyter();
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  return (
    <JupyterReactTheme>
      {serviceManager ?
        <Notebook2
          nbformat={nbformat as INotebookContent}
          id="notebook-nbformat-id"
          serviceManager={serviceManager}
          startDefaultKernel
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          extensions={extensions}
          Toolbar={NotebookToolbar}
        />
      :
        <></>
      }
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookNbformat />);
