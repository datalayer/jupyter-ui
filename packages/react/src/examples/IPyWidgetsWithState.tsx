/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import Jupyter from '../jupyter/Jupyter';
import Notebook from '../components/notebook/Notebook';
import NotebookToolbar from "./toolbars/NotebookToolbar";
import CellSidebar from "../components/notebook/cell/sidebar/CellSidebar";

import notebook from "./notebooks/IPyWidgetsExampleWithState.ipynb.json";

const IPyWidgetsWithState = () => (
  <Jupyter>
    <Notebook
      nbformat={notebook as INotebookContent}
      uid="notebook-uid"
      height='calc(100vh - 2.6rem)' // (Height - Toolbar Height).
      cellSidebarMargin={120}
      CellSidebar={CellSidebar}
      Toolbar={NotebookToolbar} 
    />
  </Jupyter>
)

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <IPyWidgetsWithState/>
);
