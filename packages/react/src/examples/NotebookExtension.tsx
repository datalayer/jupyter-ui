/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import {
  Notebook,
  CellSidebarExtension,
  CellSidebarButton,
  NotebookToolbar,
} from '../components';
import { ExampleJupyterReactTheme } from './ExampleJupyterReactTheme';
import { useJupyter } from '../jupyter';
import { ExecTimeExtension } from './extensions';

import NBFORMAT from './notebooks/NotebookExample1.ipynb.json';

const NotebookExtensionExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const extensions = useMemo(
    () => [
      new ExecTimeExtension(),
      new CellSidebarExtension({ factory: CellSidebarButton }),
    ],
    []
  );
  return (
    <ExampleJupyterReactTheme>
      {serviceManager && defaultKernel && (
        <Notebook
          nbformat={NBFORMAT as INotebookContent}
          kernel={defaultKernel}
          serviceManager={serviceManager}
          extensions={extensions}
          id="notebook-extension-id"
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          Toolbar={NotebookToolbar}
        />
      )}
    </ExampleJupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookExtensionExample />);
