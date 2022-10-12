import { useEffect, useState } from "react";
import { createRoot } from 'react-dom/client';
import { Box, Button, ButtonGroup } from '@primer/react';
import Jupyter from '../jupyter/Jupyter';
import { useJupyter } from '../jupyter/JupyterContext';
import Kernel from '../jupyter/services/kernel/Kernel';
import Notebook from '../components/notebook/Notebook';
import CellSidebarDefault from '../components/notebook/cell/sidebar/CellSidebarDefault';
import notebookExample from './NotebookExample1.ipynb.json';

import "./../../style/index.css";

const NOTEBOOK_UID = 'notebook-unmount-id';

const NotebookUnmount = () => {
  const [show, setShow] = useState(true);
  const [kernel, setKernel] = useState<Kernel>()
  const { kernelManager } = useJupyter();
  useEffect(() => {
    if (kernelManager) {
      const kernel = new Kernel({ kernelManager, kernelName: "python" });
      setKernel(kernel);
    }
  }, [kernelManager]);
  useEffect(() => {
    if (!show && kernel) {
      kernel.shutdown();
    }
  }, [show]);
  const unmount = () => {
    setShow(false);
  }
  return (
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
      { show ?
          kernel && <Notebook
            uid={NOTEBOOK_UID}
            kernel={kernel}
            model={notebookExample}
            CellSidebar={CellSidebarDefault}
            height="700px"
          />
      :
        <>
          The notebook is unmounted. The connections to the kernel should not happen any more (check the Network tab in your devtools).
        </>
      }
    </>
  );
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <Jupyter lite={false} terminals={true} startDefaultKernel={false}>
    <NotebookUnmount />
  </Jupyter>
);
