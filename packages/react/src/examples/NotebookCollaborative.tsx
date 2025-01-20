/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { Notebook } from '../components/notebook/Notebook';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import { CellSidebarButton } from '../components/notebook/cell/sidebar/CellSidebarButton';

const NotebookCollaborative = () => {
  return (
    <JupyterReactTheme>
      <Notebook
        collaborative="datalayer"
        path="collaboration.ipynb"
        id="notebook-collaboration-id"
        startDefaultKernel={true}
        height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
        cellSidebarMargin={60}
        CellSidebar={CellSidebarButton}
        Toolbar={NotebookToolbar}
      />
    </JupyterReactTheme>
  );
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookCollaborative />);
