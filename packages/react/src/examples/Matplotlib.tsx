/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { JupyterLabCss } from '../theme';
import { useJupyter } from '../jupyter';
import { CellSidebarExtension } from '../components';
import { Notebook } from '../components/notebook/Notebook';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import { ExampleJupyterReactTheme } from './ExampleJupyterReactTheme';

import NBFORMAT from './notebooks/Matplotlib.ipynb.json';

const MatplotlibExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  return (
    <ExampleJupyterReactTheme>
      <JupyterLabCss colormode="light" />
      {serviceManager && defaultKernel && (
        <Notebook
          id="notebook-matplotlib-id"
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

root.render(<MatplotlibExample />);
