import { useEffect, useState } from "react";
import { createRoot } from 'react-dom/client';
import { Box, Button, ButtonGroup } from '@primer/react';
import { INotebookContent } from '@jupyterlab/nbformat';
import Jupyter from '../jupyter/Jupyter';
import { useJupyter } from '../jupyter/JupyterContext';
import Kernel from '../jupyter/services/kernel/Kernel';
import Notebook from '../components/notebook/Notebook';
import CellSidebarDefault from '../components/notebook/cell/sidebar/CellSidebarDefault';

import notebook from './notebooks/NotebookExample1.ipynb.json';

const NotebookUnmount = () => {
  const { kernelManager, serverSettings } = useJupyter();
  const [showNotebook, setShowNotebook] = useState(false);
  const [kernel, setKernel] = useState<Kernel>()
  useEffect(() => {
    if (kernelManager) {
      const kernel = new Kernel({
        kernelManager,
        kernelName: "defaultKernel",
        kernelType: "notebook",
        kernelSpecName: "python",
        serverSettings
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
  }
  return (
    <>
      { (showNotebook && kernel) ?
        (
            <>
              <Box display="flex">
                <ButtonGroup>
                  <Button
                    variant="default"
                    size="small"
                    onClick={unmount}
                  >
                    Unmount
                  </Button>
                </ButtonGroup>
              </Box>
              <Notebook
                nbformat={notebook as INotebookContent}
//                kernel={kernel}
                CellSidebar={CellSidebarDefault}
                height="700px"
                uid="notebook-unmount-id"
              />
            </>
          )
        :
          <>
            <Box>
              The Notebook React.js component is not mounted.
            </Box>
            <Box>
              The connections to the Kernel should not happen any more - Check the Network tab in your Browser Devtools.
            </Box>
          </>
      }
    </>
  );
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <Jupyter>
    <NotebookUnmount />
  </Jupyter>
);
