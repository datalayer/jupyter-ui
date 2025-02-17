/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { Session } from '@jupyterlab/services';
import { OnSessionConnection } from '../state';
import { Box, Text } from '@primer/react';
import { INotebookContent } from '@jupyterlab/nbformat';
import { JupyterReactTheme } from '../theme';
import { Notebook, KernelIndicator } from '../components';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import { CellSidebar } from '../components/notebook/cell/sidebar/CellSidebar';

import nbformat from './notebooks/Lite.ipynb.json';

const NotebookLite = () => {
  const [session, setSession] = useState<Session.ISessionConnection>();
  const onSessionConnection: OnSessionConnection = (session: Session.ISessionConnection | undefined) => {
    console.log('Received a Kernel Session.', session?.id, session?.kernel?.clientId);
    setSession(session);
  }
  return (
    <JupyterReactTheme>
      <Box as="h1">A Jupyter Notebook with a Lite Kernel</Box>
      <Box display="flex">
        <Box>
          <Text>Kernel Indicator</Text>
        </Box>
        <Box ml={3}>
          <KernelIndicator kernel={session?.kernel}/>
        </Box>
      </Box>
      <Notebook
        startDefaultKernel
        lite
        nbformat={nbformat as INotebookContent}
        id="notebook-lite-id"
        height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
        onSessionConnection={onSessionConnection}
        cellSidebarMargin={120}
        CellSidebar={CellSidebar}
        Toolbar={NotebookToolbar}
      />
    </JupyterReactTheme>
  )
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookLite />);
