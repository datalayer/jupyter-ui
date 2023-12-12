/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { useDispatch } from "react-redux";
import { Box, Button } from '@primer/react';
import Jupyter from '../jupyter/Jupyter';
import { useJupyter } from '../jupyter/JupyterContext';
import { Kernel } from '../jupyter/kernel/Kernel';
import Notebook from '../components/notebook/Notebook';
import { notebookActions } from '../components/notebook/NotebookRedux';
import CellSidebar from '../components/notebook/cell/sidebar/CellSidebar';

const NOTEBOOK_UID = 'notebook-kernel-id';

const NEW_KERNEL_NAME = "python-bis"

const NotebookKernelChange = () => {
  const { kernelManager, serverSettings } = useJupyter();
  const dispatch = useDispatch();
  const changeKernel = () => {
    if (kernelManager) {
      const kernel = new Kernel({
        kernelManager,
        kernelName: NEW_KERNEL_NAME,
        kernelSpecName: NEW_KERNEL_NAME,
        kernelType: "notebook",
        serverSettings,
      });
      kernel.ready.then(() => {
        dispatch(notebookActions.changeKernel({ uid: NOTEBOOK_UID, kernel }));
        alert('The kernel is changed (was python3, now is python-bis). Bummer, all your variables are lost!')
      });
    }
  }
  return (
    <>
      <Box display="flex">
        <Button
          variant="default"
          size="small"
          onClick={changeKernel}
          >
          Assign a new Kernel
        </Button>
      </Box>
      <Notebook
        path="test.ipynb"
        height="500px"
        uid={NOTEBOOK_UID}
        CellSidebar={CellSidebar}
      />
    </>
  );
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <Jupyter defaultKernelName="python">
    <NotebookKernelChange />
  </Jupyter>
);
