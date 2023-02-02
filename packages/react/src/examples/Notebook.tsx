import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import Jupyter from '../jupyter/Jupyter';
import Notebook from '../components/notebook/Notebook';
import NotebookToolbar from "./toolbars/NotebookToolbar";
import CellSidebarNew from "../components/notebook/cell/sidebar/CellSidebarNew";
import notebookExample1 from "./notebooks/NotebookExample1.ipynb.json";

import "./../../style/index.css";

const NOTEBOOK_UID = 'notebook-uid';

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <Jupyter lite={false} terminals={true}>
    <Notebook
      path="test.ipynb"
      model={notebookExample1 as INotebookContent}
      CellSidebar={CellSidebarNew}
      Toolbar={NotebookToolbar}
      height='calc(100vh - 2.6rem)' // (Height - Toolbar Height).
      cellSidebarMargin={60}
      uid={NOTEBOOK_UID}
    />
  </Jupyter>
);
