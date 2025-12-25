/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo, useState } from 'react';
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
import { Session } from '@jupyterlab/services';
import { OnSessionConnection } from '../state';

import NBFORMAT from './notebooks/NotebookExample1.ipynb.json';

const Notebook2Example = () => {
  const { serviceManager } = useJupyter({
    lite: true,
    startDefaultKernel: false,
  });
  const [session, setSession] = useState<Session.ISessionConnection>();
  const extensions = useMemo(
    () => [
      new CellToolbarExtension(),
      new CellSidebarExtension({ factory: CellSidebarButton }),
    ],
    []
  );
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
  return serviceManager ? (
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
        nbformat={NBFORMAT as INotebookContent}
        id="notebook2-nbformat-id"
        // kernel={defaultKernel}
        //        kernelId={defaultKernel.id}
        startDefaultKernel
        serviceManager={serviceManager}
        height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
        extensions={extensions}
        onSessionConnection={onSessionConnection}
        Toolbar={NotebookToolbar}
      />
    </JupyterReactTheme>
  ) : (
    <></>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<Notebook2Example />);
