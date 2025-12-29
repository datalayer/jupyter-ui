/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import {
  Notebook2,
  CellSidebarExtension,
  CellSidebarButton,
  NotebookToolbar,
} from '../components';
import { JupyterReactTheme } from '../theme';
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
    <JupyterReactTheme>
      {serviceManager && defaultKernel && (
        <Notebook2
          nbformat={NBFORMAT as INotebookContent}
          kernel={defaultKernel}
          serviceManager={serviceManager}
          extensions={extensions}
          id="notebook-extension-id"
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          Toolbar={NotebookToolbar}
        />
      )}
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookExtensionExample />);
