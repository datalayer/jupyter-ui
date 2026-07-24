/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { INotebookContent } from '@jupyterlab/nbformat';
import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { CellSidebarExtension } from '../components';
import { Notebook } from '../components/notebook/Notebook';
import { useJupyter } from '../jupyter';
import { ExampleJupyterReactTheme } from './ExampleJupyterReactTheme';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';

import NBMODEL from './notebooks/IPyWidgetsExample.ipynb.json';

const DashboardExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  return (
    <ExampleJupyterReactTheme>
      {serviceManager && defaultKernel && (
        <Notebook
          nbformat={NBMODEL as INotebookContent}
          id="notebook-id"
          kernel={defaultKernel}
          serviceManager={serviceManager}
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

root.render(<DashboardExample />);
