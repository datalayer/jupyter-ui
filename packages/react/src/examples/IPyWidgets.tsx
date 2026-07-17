/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
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

const IPyWidgetsExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  return (
    <ExampleJupyterReactTheme>
      {serviceManager && defaultKernel && (
        <Notebook
          id="notebook-id"
          kernel={defaultKernel}
          serviceManager={serviceManager}
          nbformat={NBMODEL as INotebookContent}
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

root.render(<IPyWidgetsExample />);
