/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Box, Button } from '@primer/react';
import Jupyter from '../jupyter/Jupyter';
import { useJupyter } from '../jupyter/JupyterContext';
import { Kernel } from '../jupyter/kernel/Kernel';
import Notebook from '../components/notebook/Notebook';
import CellSidebar from '../components/notebook/cell/sidebar/CellSidebar';
import useNotebookStore from '../components/notebook/NotebookState';

const NOTEBOOK_ID = 'notebook-kernel-id';

const NEW_KERNEL_NAME = 'deno';

const NotebookKernelChange = () => {
  const { kernelManager, serviceManager } = useJupyter();
  const notebookStore = useNotebookStore();
  const changeKernel = () => {
    if (kernelManager && serviceManager) {
      const kernel = new Kernel({
        kernelManager,
        kernelName: NEW_KERNEL_NAME,
        kernelSpecName: NEW_KERNEL_NAME,
        kernelspecsManager: serviceManager.kernelspecs,
        sessionManager: serviceManager.sessions,
      });
      kernel.ready.then(() => {
        notebookStore.changeKernel({ id: NOTEBOOK_ID, kernel });
        alert(
          `The kernel is changed (was python3, now ${NEW_KERNEL_NAME}). Bummer, all your variables are lost!`
        );
      });
    }
  };
  return (
    <>
      <Box display="flex">
        <Button variant="default" size="small" onClick={changeKernel}>
          Assign a new Kernel
        </Button>
      </Box>
      <Notebook
        path="test.ipynb"
        height="500px"
        id={NOTEBOOK_ID}
        CellSidebar={CellSidebar}
      />
    </>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <Jupyter defaultKernelName="python">
    <NotebookKernelChange />
  </Jupyter>
);
