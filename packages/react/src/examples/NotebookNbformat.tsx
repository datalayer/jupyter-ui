/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { INotebookContent } from '@jupyterlab/nbformat';
import { createRoot } from 'react-dom/client';
import { useJupyter } from '../jupyter';
import { Notebook, CellSidebarExtension, NotebookToolbar } from '../components';
import { JupyterReactTheme } from '../theme';

import NBFORMAT from './notebooks/NotebookExample1.ipynb.json';

const NotebookNbformatExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  return (
    <JupyterReactTheme>
      {serviceManager && defaultKernel ? (
        <Notebook
          nbformat={NBFORMAT as INotebookContent}
          id="notebook-nbformat-id"
          serviceManager={serviceManager}
          kernel={defaultKernel}
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          extensions={extensions}
          Toolbar={NotebookToolbar}
        />
      ) : (
        <></>
      )}
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookNbformatExample />);
