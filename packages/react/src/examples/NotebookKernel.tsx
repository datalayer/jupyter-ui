/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { useJupyter } from '../jupyter';
import { JupyterReactTheme } from '../theme';
import { Notebook } from '../components/notebook/Notebook';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import { CellSidebarButton } from '../components/notebook/cell/sidebar/CellSidebarButton';
import { CellSidebarExtension } from '../components/notebook/cell/sidebar/CellSidebarExtension';

const NotebookKernelExample = () => {
  const { serviceManager } = useJupyter({
    startDefaultKernel: false,
  });
  const extensions = useMemo(
    () => [new CellSidebarExtension({ factory: CellSidebarButton })],
    []
  );
  return (
    <JupyterReactTheme>
      {serviceManager && (
        <Notebook
          path="ipywidgets.ipynb"
          id="notebook-kernel-id"
          startDefaultKernel
          serviceManager={serviceManager}
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

root.render(<NotebookKernelExample />);
