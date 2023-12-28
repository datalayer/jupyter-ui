/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Box, Button } from '@primer/react';
import { INotebookContent } from '@jupyterlab/nbformat';
import Jupyter from '../jupyter/Jupyter';
import { useJupyter } from '../jupyter/JupyterContext';
import Kernel from '../jupyter/kernel/Kernel';
import Notebook from '../components/notebook/Notebook';
import CellSidebar from '../components/notebook/cell/sidebar/CellSidebar';

import notebook from './notebooks/NotebookExample1.ipynb.json';

const NotebookUnmount = () => {
  const { kernelManager, serverSettings } = useJupyter();
  const [showNotebook, setShowNotebook] = useState(false);
  const [kernel, setKernel] = useState<Kernel>();
  useEffect(() => {
    if (kernelManager) {
      const kernel = new Kernel({
        kernelManager,
        kernelName: 'defaultKernel',
        kernelSpecName: 'python',
        kernelType: 'notebook',
        serverSettings,
      });
      setKernel(kernel);
      setShowNotebook(true);
    }
  }, [kernelManager]);
  useEffect(() => {
    if (!showNotebook && kernel) {
      kernel.shutdown();
    }
  }, [showNotebook]);
  const unmount = () => {
    setShowNotebook(false);
  };
  return (
    <>
      {showNotebook && kernel ? (
        <>
          <Box display="flex">
            <Button variant="default" size="small" onClick={unmount}>
              Unmount
            </Button>
          </Box>
          <Notebook
            nbformat={notebook as INotebookContent}
            uid="notebook-unmount-id"
            //                kernel={kernel}
            height="700px"
            CellSidebar={CellSidebar}
          />
        </>
      ) : (
        <>
          <Box>The Notebook React.js component is not mounted.</Box>
          <Box>
            The connections to the Kernel should not happen any more - Check the
            Network tab in your Browser Devtools.
          </Box>
        </>
      )}
    </>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <Jupyter>
    <NotebookUnmount />
  </Jupyter>
);
