/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Box, Text } from '@primer/react';
import { INotebookContent } from '@jupyterlab/nbformat';
import { Kernel } from '@jupyterlab/services';
import { JupyterReactTheme } from '../theme';
import { OnKernelConnection } from '../state';
import { Notebook } from '../components/notebook/Notebook';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import { CellSidebar } from '../components/notebook/cell/sidebar/CellSidebar';

import nbformat from './notebooks/NotebookExample1.ipynb.json';

const NotebookOnKernelConnection = () => {
  const [kernelConnections, setKernelConnections] = useState<Array<Kernel.IKernelConnection>>([])
  const onKernelConnection: OnKernelConnection = (kernelConnection: Kernel.IKernelConnection) => {
    console.log('Received a Kernel Connection.', kernelConnection);
    setKernelConnections(kernelConnections.concat(kernelConnection));
  }
  return (
    <JupyterReactTheme>
      <Box as="h1">A Jupyter Notebook Listening to Kernel Connections</Box>
      <Box>
        <Text as="h3">Kernel Connections</Text>
      </Box>
      <Box>
        {kernelConnections.map(kernelConnection => {
          return (
            <Box key={kernelConnection.clientId}>
              Client ID ({kernelConnection.clientId}) - Kernel ID ({kernelConnection.id})
            </Box>
          )
        })}
      </Box>
      <Notebook
        nbformat={nbformat as INotebookContent}
        id="notebook-on-kernel-connection-id"
        height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
        onKernelConnection={onKernelConnection}
        cellSidebarMargin={120}
        CellSidebar={CellSidebar}
        Toolbar={NotebookToolbar}
      />
    </JupyterReactTheme>
  );
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookOnKernelConnection />);
