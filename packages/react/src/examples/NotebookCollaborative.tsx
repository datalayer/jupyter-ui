/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { useJupyter, JupyterCollaborationProvider } from '../jupyter';
import {
  Notebook,
  CellSidebarExtension,
  CellSidebarButton,
} from '../components';

const NotebookCollaborativeExample = () => {
  const { serviceManager } = useJupyter();
  const extensions = useMemo(
    () => [new CellSidebarExtension({ factory: CellSidebarButton })],
    []
  );

  const collaborationProvider = useMemo(
    () => new JupyterCollaborationProvider(),
    []
  );

  return serviceManager ? (
    <JupyterReactTheme>
      <Notebook
        path="collaboration.ipynb"
        id="notebook2-collaboration-id"
        startDefaultKernel
        serviceManager={serviceManager}
        height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
        extensions={extensions}
        collaborationProvider={collaborationProvider}
      />
    </JupyterReactTheme>
  ) : (
    <></>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookCollaborativeExample />);
