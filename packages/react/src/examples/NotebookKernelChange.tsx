/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Flash } from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { useJupyter } from '../jupyter/JupyterUse';
import { Kernel } from '../jupyter/kernel/Kernel';
import { CellSidebarExtension } from '../components';
import { Notebook } from '../components/notebook/Notebook';
// import { useNotebookStore } from '../components/notebook/NotebookState';

const NOTEBOOK_ID = 'notebook-kernel-change-id';

// const PYTHON_KERNEL_NAME = 'python';

const DENO_KERNEL_NAME = 'deno';

const NotebookKernelChangeExample = () => {
  const { kernelManager, serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const [message, _] = useState('');
//  const notebookStore = useNotebookStore();
//  const notebook = notebookStore.selectNotebook(NOTEBOOK_ID);

  const extensions = useMemo(() => [new CellSidebarExtension()], []);

  const changeKernel = () => {
    if (kernelManager && serviceManager) {
      const newKernel = new Kernel({
        kernelManager,
        kernelName: DENO_KERNEL_NAME,
        kernelSpecName: DENO_KERNEL_NAME,
        kernelspecsManager: serviceManager.kernelspecs,
        sessionManager: serviceManager.sessions,
      });
      newKernel.ready.then(() => {
        /*
        notebookStore.changeKernel({ id: NOTEBOOK_ID, kernel: newKernel });
        setMessage(
          `🥺 Bummer, all your variables are lost! The kernel was ${PYTHON_KERNEL_NAME} and is now ${DENO_KERNEL_NAME}). Try with: import pl from "npm:nodejs-polars";`
        );
        */
      });
    }
  };
  return (
    <JupyterReactTheme>
      <Box display="flex">
        <Box>
          <Button variant="default" size="small" onClick={changeKernel}>
            Assign another Kernel
          </Button>
        </Box>
        <Box ml={3}>Kernel ID: {defaultKernel?.id}</Box>
        {/*
        <Box ml={3}>
          Kernel Client ID: {notebook?.adapter?.kernel?.clientId}
        </Box>
        <Box ml={3}>
          Kernel Session ID: {notebook?.adapter?.kernel?.session.id}
        </Box>
        <Box ml={3}>
          Kernel Info: {notebook?.adapter?.kernel?.info?.language_info.name}
        </Box>
        */}
      </Box>
      {message && (
        <Box>
          <Flash>{message}</Flash>
        </Box>
      )}
      {serviceManager && defaultKernel && (
        <Notebook
          id={NOTEBOOK_ID}
          kernel={defaultKernel}
          serviceManager={serviceManager}
          path="test.ipynb"
          height="500px"
          extensions={extensions}
        />
      )}
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookKernelChangeExample />);
