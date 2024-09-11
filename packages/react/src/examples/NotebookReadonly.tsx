/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import JupyterReactTheme from '../themes/JupyterReactTheme';
import Notebook from '../components/notebook/Notebook';
import NotebookToolbar from './toolbars/NotebookToolbar';
import CellSidebar from '../components/notebook/cell/sidebar/CellSidebar';

import nbformat from './notebooks/NotebookExample1.ipynb.json';

const NotebookReadonly = () => {
  return (
    <JupyterReactTheme>
      <Notebook
        readonly
        nbformat={nbformat}
        id="notebook-model-id"
        height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
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

root.render(<NotebookReadonly />);