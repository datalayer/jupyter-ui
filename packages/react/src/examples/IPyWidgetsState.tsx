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
import { CellSidebarExtension } from '../components';
import { Notebook2 } from '../components/notebook/Notebook2';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';

import NBMODEL from './notebooks/IPyWidgetsExampleWithState.ipynb.json';

const IPyWidgetsStateExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  return (
    <JupyterReactTheme>
      {serviceManager && defaultKernel && (
        <Notebook2
          id="notebook-id"
          kernel={defaultKernel}
          serviceManager={serviceManager}
          nbformat={NBMODEL as INotebookContent}
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

root.render(<IPyWidgetsStateExample />);
