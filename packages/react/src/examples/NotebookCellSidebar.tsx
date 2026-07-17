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
import { CellSidebarExtension } from '../components';
import { Notebook } from '../components/notebook/Notebook';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import { CellSidebarSource } from './extensions/cellsidebars/CellSidebarSource';

import NBFORMAT from './notebooks/NotebookExample1.ipynb.json';

const NotebookCellSidebarExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const extensions = useMemo(
    () => [new CellSidebarExtension({ factory: CellSidebarSource })],
    []
  );
  return (
    <ExampleJupyterReactTheme>
      {serviceManager && defaultKernel && (
        <Notebook
          kernel={defaultKernel}
          serviceManager={serviceManager}
          nbformat={NBFORMAT as INotebookContent}
          id="notebook-cell-sidebar-id"
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          cellSidebarMargin={160}
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

root.render(<NotebookCellSidebarExample />);
