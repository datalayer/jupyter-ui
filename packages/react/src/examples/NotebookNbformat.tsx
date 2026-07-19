/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { INotebookContent } from '@jupyterlab/nbformat';
import { createRoot } from 'react-dom/client';
import { useJupyter } from '../jupyter';
import { Notebook, CellSidebarExtension, NotebookToolbar } from '../components';
import { ExampleJupyterReactTheme } from './ExampleJupyterReactTheme';

import NBFORMAT from './notebooks/NotebookExample1.ipynb.json';

const NotebookNbformatExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  return (
    <ExampleJupyterReactTheme>
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
    </ExampleJupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookNbformatExample />);
