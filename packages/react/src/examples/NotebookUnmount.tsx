/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { INotebookContent } from '@jupyterlab/nbformat';
import { Box, Button } from '@primer/react';
import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CellSidebarExtension } from '../components';
import { Notebook } from '../components/notebook/Notebook';
import { useJupyter } from '../jupyter/JupyterContext';
import Kernel from '../jupyter/kernel/Kernel';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import notebook from './notebooks/NotebookExample1.ipynb.json';

const NotebookUnmount = () => {
  const { kernelManager, serviceManager } = useJupyter();
  const [showNotebook, setShowNotebook] = useState(false);
  const [kernel, setKernel] = useState<Kernel>();

  const extensions = useMemo(() => [new CellSidebarExtension()], []);

  useEffect(() => {
    if (serviceManager && kernelManager) {
      const kernel = new Kernel({
        kernelManager,
        kernelName: 'defaultKernel',
        kernelSpecName: 'python',
        kernelspecsManager: serviceManager.kernelspecs,
        sessionManager: serviceManager.sessions,
      });
      setKernel(kernel);
      setShowNotebook(true);
    }
  }, [serviceManager, kernelManager]);
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
            id="notebook-unmount-id"
            //                kernel={kernel}
            height="700px"
            extensions={extensions}
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
  <JupyterReactTheme>
    <NotebookUnmount />
  </JupyterReactTheme>
);
