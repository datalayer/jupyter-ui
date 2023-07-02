import { useEffect, useState } from "react";
import { createRoot } from 'react-dom/client';
import { Box, Button, ButtonGroup } from '@primer/react';
import { INotebookContent } from '@jupyterlab/nbformat';
import Jupyter from '../jupyter/Jupyter';
import { useJupyter } from '../jupyter/JupyterContext';
import Kernel from '../jupyter/services/kernel/Kernel';
import Notebook from '../components/notebook/Notebook';
import CellSidebarDefault from '../components/notebook/cell/sidebar/CellSidebarDefault';

import notebookExample from './notebooks/NotebookExample1.ipynb.json';

import "./../../style/index.css";

const NotebookUnmount = () => {
  const [showNotebook, setShowNotebook] = useState(false);
  const [kernel, setKernel] = useState<Kernel>()
  const { kernelManager } = useJupyter();
  useEffect(() => {
    if (kernelManager) {
      const kernel = new Kernel({ kernelManager, kernelName: "python" });
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
                nbformat={notebookExample as INotebookContent}
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
  <Jupyter lite={false} terminals={true} startDefaultKernel={true}>
    <NotebookUnmount />
  </Jupyter>
);
