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

import nbformat from './notebooks/NotebookExample1.ipynb.json';
import { Session } from '@jupyterlab/services';
import { OnSessionConnection } from '../state';

const Notebook2Example = () => {
  const { serviceManager } = useJupyter({ lite: true });
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
        nbformat={nbformat as INotebookContent}
        id="notebook-nbformat-id"
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
