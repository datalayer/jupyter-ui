/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Text } from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import { INotebookContent } from '@jupyterlab/nbformat';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { useJupyter } from '../jupyter';
import {
  Notebook2,
  CellSidebarExtension,
  CellSidebarButton,
  NotebookToolbar,
  KernelIndicator,
} from '../components';
import { CellToolbarExtension } from './extensions';

import nbformat from './notebooks/NotebookExample1.ipynb.json';
import { Session } from '@jupyterlab/services';
import { OnSessionConnection } from '../state';

const Notebook2Lite = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    lite: true,
    startDefaultKernel: true,
  });
  const [kernelReady, setKernelReady] = useState(false);
  const [session, setSession] = useState<Session.ISessionConnection>();
  const onSessionConnection: OnSessionConnection = (
    session: Session.ISessionConnection | undefined
  ) => {
    console.log(
      'Received a Kernel Session.',
      session?.id,
      session?.kernel?.clientId
    );
    setSession(session);
  };
  const extensions = useMemo(
    () => [
      new CellToolbarExtension(),
      new CellSidebarExtension({ factory: CellSidebarButton }),
    ],
    []
  );
  useEffect(() => {
    if (defaultKernel) {
      defaultKernel.ready.then(() => setKernelReady(true));
    }
  }, [defaultKernel]);

  return serviceManager && defaultKernel && kernelReady ? (
    <JupyterReactTheme>
      <Box display="flex">
        <Box>
          <Text>Kernel Indicator</Text>
        </Box>
        <Box ml={3}>
          <KernelIndicator kernel={session?.kernel} />
        </Box>
      </Box>
      <Notebook2
        nbformat={nbformat as INotebookContent}
        id="notebook-nbformat-id"
        startDefaultKernel={false}
        kernelId={defaultKernel?.id}
        serviceManager={serviceManager}
        height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
        extensions={extensions}
        onSessionConnection={onSessionConnection}
        Toolbar={NotebookToolbar}
      />
    </JupyterReactTheme>
  ) : (
    <Box>Loading Jupyter Lite...</Box>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<Notebook2Lite />);
