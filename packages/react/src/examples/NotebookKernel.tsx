/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Kernel, useJupyter } from '../jupyter';
import { JupyterReactTheme } from '../theme';
import { CellSidebarExtension } from '../components';
import { CellSidebarButton } from '../components/notebook/cell/sidebar/CellSidebarButton';
import { Notebook } from '../components/notebook/Notebook';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';

const NotebookKernel = () => {
  const { kernelManager, serviceManager } = useJupyter();
  const kernel = useMemo(() => {
    if (kernelManager && serviceManager) {
      return new Kernel({
        kernelManager,
        kernelName: 'python3',
        kernelSpecName: 'python3',
        kernelType: 'notebook',
        kernelspecsManager: serviceManager.kernelspecs,
        sessionManager: serviceManager.sessions,
      });
    }
  }, [kernelManager, serviceManager]);
  return (
    <JupyterReactTheme>
      <Notebook
        path="ipywidgets.ipynb"
        id="notebook-kernel-id"
        kernel={kernel}
        height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
        extensions={[new CellSidebarExtension({ factory: CellSidebarButton })]}
        Toolbar={NotebookToolbar}
      />
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookKernel />);
