/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { CellSidebarExtension } from '../components';
import { CellSidebarButton } from '../components/notebook/cell/sidebar/CellSidebarButton';
import { Notebook } from '../components/notebook/Notebook';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import { JupyterCollaborationProvider } from '../jupyter/collaboration/providers/JupyterCollaborationProvider';

const NotebookCollaborativeExample = () => {
  const extensions = useMemo(
    () => [new CellSidebarExtension({ factory: CellSidebarButton })],
    []
  );

  // Create a Jupyter collaboration provider
  const collaborationProvider = useMemo(
    () => new JupyterCollaborationProvider(),
    []
  );

  return (
    <JupyterReactTheme>
      <Notebook
        collaborationProvider={collaborationProvider}
        path="collaboration.ipynb"
        id="notebook-collaboration-id"
        startDefaultKernel
        height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
        extensions={extensions}
        Toolbar={NotebookToolbar}
      />
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookCollaborativeExample />);
