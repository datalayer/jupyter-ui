/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { useJupyter } from '../jupyter';
import { Notebook2, CellSidebarExtension, CellSidebarButton } from '../components';
import { CellToolbarExtension } from './extensions';

import nbformat from './notebooks/NotebookExample1.ipynb.json';

const Notebook2Example = () => {
  const { serviceManager } = useJupyter();
  const extensions = useMemo(() => [
    new CellToolbarExtension(),
    new CellSidebarExtension({ factory: CellSidebarButton })
  ], []);
  return (
    serviceManager ?
      <JupyterReactTheme>
        <Notebook2
          nbformat={nbformat as INotebookContent}
          id="notebook-nbformat-id"
          startDefaultKernel
          serviceManager={serviceManager}
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          extensions={extensions}
          /*
          collaborationServer={{
            baseURL: 'https://prod1.datalayer.run',
            token: '',
            documentName: '',
            type: 'datalayer'
          }}
          */
        />
      </JupyterReactTheme>
    :
      <></>
  )
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<Notebook2Example />);
