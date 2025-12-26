/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Box } from '@datalayer/primer-addons';
import { INotebookContent } from '@jupyterlab/nbformat';
import { Session } from '@jupyterlab/services';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { useJupyter } from '../jupyter/JupyterContext';
import {
  CellSidebarExtension,
  CellSidebarButton,
  KernelIndicator,
  Notebook2,
  NotebookToolbar,
} from '../components';
import { CellToolbarExtension } from './extensions';
import { OnSessionConnection } from '../state';

import NBFORMAT from './notebooks/NotebookExample1.ipynb.json';

const Notebook2LiteExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    lite: true,
    startDefaultKernel: true,
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
    console.log('Kernel Session.', session?.id, session?.kernel?.id);
    setSession(session);
  };
  return (
    <JupyterReactTheme>
      <Box display="flex">
        <Box ml={3}>
          <KernelIndicator kernel={session?.kernel} label="Kernel Indicator" />
        </Box>
      </Box>
      {serviceManager && defaultKernel && (
        <Notebook2
          id="notebook2-nbformat-id"
          kernel={defaultKernel}
          serviceManager={serviceManager}
          nbformat={NBFORMAT as INotebookContent}
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          extensions={extensions}
          Toolbar={NotebookToolbar}
          onSessionConnection={onSessionConnection}
        />
      )}
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<Notebook2LiteExample />);
