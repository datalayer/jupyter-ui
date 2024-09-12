/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import JupyterReactTheme from '../themes/JupyterReactTheme';
import Notebook from '../components/notebook/Notebook';
import NotebookToolbar from './../components/notebook/toolbar/NotebookToolbar';
import CellSidebar from '../components/notebook/cell/sidebar/CellSidebar';

import notebook from './notebooks/IPyWidgetsExampleWithState.ipynb.json';

const IPyWidgetsWithState = () => (
  <JupyterReactTheme>
    <Notebook
      nbformat={notebook as INotebookContent}
      id="notebook-id"
      height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
      cellSidebarMargin={120}
      CellSidebar={CellSidebar}
      Toolbar={NotebookToolbar}
    />
  </JupyterReactTheme>
);

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<IPyWidgetsWithState />);
