/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { JupyterLabCss, JupyterReactTheme } from '../theme';
import { useJupyter } from '../jupyter';
import { CellSidebarExtension } from '../components';
import { Notebook2 } from '../components/notebook/Notebook2';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';

import NBFORMAT from './notebooks/Matplotlib.ipynb.json';

const MatplotlibExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  return (
    <JupyterReactTheme>
      <JupyterLabCss colormode="light" />
      {serviceManager && defaultKernel && (
        <Notebook2
          id="notebook-matplotlib-id"
          kernel={defaultKernel}
          serviceManager={serviceManager}
          nbformat={NBFORMAT as INotebookContent}
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
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

root.render(<MatplotlibExample />);
