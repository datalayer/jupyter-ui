import { useState } from "react";
import { createRoot } from 'react-dom/client';
import { Box, Button, ButtonGroup } from '@primer/react';
import Jupyter from '../jupyter/Jupyter';
import { useJupyter } from '../jupyter/JupyterContext';
import { Kernel } from '../jupyter/services/kernel/Kernel';
import Notebook from '../components/notebook/Notebook';
import CellSidebarDefault from '../components/notebook/cell/sidebar/CellSidebarDefault';

import "./../../style/index.css";

const NotebookKernelChange = () => {
  const { kernelManager } = useJupyter();
  const [kernel, setKernel] = useState<Kernel>();
  const changeKernel = () => {
    const kernel = new Kernel({ kernelManager, kernelName: "pythonqsdf" });
    kernel.getJupyterKernel().then((kernelConnection) => {
      setKernel(kernel);
    });
  }
  return (
    <>
      <Box display="flex">
        <ButtonGroup>
          <Button
            variant="default"
            size="small"
            onClick={changeKernel}
          >
            Switch Kernel
          </Button>
        </ButtonGroup>
      </Box>
      <Notebook
        path="test.ipynb"
        kernel={kernel}
        CellSidebar={CellSidebarDefault}
        height="500px"
      />
    </>
  );
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <Jupyter lite={false} terminals={true}>
    <NotebookKernelChange />
  </Jupyter>
);
