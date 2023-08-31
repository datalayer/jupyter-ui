import { createRoot } from 'react-dom/client';
import { useDispatch } from "react-redux";
import { Box, Button, ButtonGroup } from '@primer/react';
import Jupyter from '../jupyter/Jupyter';
import { useJupyter } from '../jupyter/JupyterContext';
import { Kernel } from '../jupyter/services/kernel/Kernel';
import Notebook from '../components/notebook/Notebook';
import { notebookActions } from '../components/notebook/NotebookState';
import CellSidebarDefault from '../components/notebook/cell/sidebar/CellSidebarDefault';

const NOTEBOOK_UID = 'notebook-kernel-id';

const NotebookKernelChange = () => {
  const { kernelManager, serverSettings } = useJupyter();
  const dispatch = useDispatch();
  const changeKernel = () => {
    if (kernelManager) {
      const kernel = new Kernel({
        kernelManager,
        kernelName: "defaultKernel",
        kernelType: "notebook",
        kernelSpecName: "python",
        serverSettings,
      });
      kernel.ready.then(() => {
        dispatch(notebookActions.changeKernel({ uid: NOTEBOOK_UID, kernel }));
        alert('The kernel is changed.')
      });
    }
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
            Assign a new Kernel
          </Button>
        </ButtonGroup>
      </Box>
      <Notebook
        uid={NOTEBOOK_UID}
        path="test.ipynb"
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
  <Jupyter lite={false} terminals={true} defaultKernelName="python">
    <NotebookKernelChange />
  </Jupyter>
);
