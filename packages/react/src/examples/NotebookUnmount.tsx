/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { Button } from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import { CellSidebarExtension } from '../components';
import { Notebook } from '../components/notebook/Notebook';
import { useJupyter } from '../jupyter/JupyterContext';
import { Kernel } from '../jupyter/kernel/Kernel';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';

import NOTEBOOK from './notebooks/NotebookExample1.ipynb.json';

const NotebookUnmountExample = () => {
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
    <JupyterReactTheme>
      {showNotebook && kernel ? (
        <>
          <Box display="flex">
            <Button variant="default" size="small" onClick={unmount}>
              Unmount
            </Button>
          </Box>
          <Notebook
            id="notebook-unmount-id"
            startDefaultKernel
            nbformat={NOTEBOOK as INotebookContent}
            // kernel={kernel}
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
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookUnmountExample />);
