/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import Jupyter from '../jupyter/Jupyter';
import Notebook from '../components/notebook/Notebook';
import NotebookToolbar from './toolbars/NotebookToolbar';
import CellSidebar from '../components/notebook/cell/sidebar/CellSidebarButton';

const NOTEBOOK_UID = 'notebook-uid';

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <Jupyter>
    <Notebook
      url="https://raw.githubusercontent.com/datalayer/jupyter-ui/main/packages/react/src/examples/notebooks/IPyWidgetsExampleWithState.ipynb.json"
      uid={NOTEBOOK_UID}
      height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
      cellSidebarMargin={60}
      CellSidebar={CellSidebar}
      Toolbar={NotebookToolbar}
    />
  </Jupyter>
);
