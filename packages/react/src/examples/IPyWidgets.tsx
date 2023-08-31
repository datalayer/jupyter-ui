import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import Jupyter from '../jupyter/Jupyter';
import Notebook from '../components/notebook/Notebook';
import NotebookToolbar from "./toolbars/NotebookToolbar";
import CellSidebarDefault from "../components/notebook/cell/sidebar/CellSidebarDefault";

import notebook from "./notebooks/IPyWidgetsExample1.ipynb.json";

const IPyWidgets = () => (
  <Jupyter>
    <Notebook
      nbformat={notebook as INotebookContent}
      uid="notebook-uid"
      height='calc(100vh - 2.6rem)' // (Height - Toolbar Height).
      cellSidebarMargin={120}
      CellSidebar={CellSidebarDefault}
      Toolbar={NotebookToolbar} 
    />
  </Jupyter>
)

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <IPyWidgets/>
);
