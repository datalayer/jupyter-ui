/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { useJupyter } from '../jupyter';
import { ExampleJupyterReactTheme } from './ExampleJupyterReactTheme';
import { Notebook } from '../components/notebook/Notebook';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import { CellSidebarExtension } from '../components';

import NBFORMAT from './notebooks/PyGWalker.ipynb.json';

const PyGWalkerExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  return (
    <ExampleJupyterReactTheme>
      {serviceManager && defaultKernel && (
        <Notebook
          id="notebook-pygwalker-id"
          kernel={defaultKernel}
          serviceManager={serviceManager}
          nbformat={NBFORMAT as INotebookContent}
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          extensions={extensions}
          Toolbar={NotebookToolbar}
        />
      )}
    </ExampleJupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<PyGWalkerExample />);
