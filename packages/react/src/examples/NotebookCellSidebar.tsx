import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import Jupyter from '../jupyter/Jupyter';
import Notebook from '../components/notebook/Notebook';
import NotebookToolbar from "./toolbars/NotebookToolbar";
import CellSidebarSource from "./sidebars/CellSidebarSource";

import nbformat from "./notebooks/NotebookExample1.ipynb.json";

const NotebookCellSidebar = () => (
  <Jupyter>
    <Notebook
      nbformat={nbformat as INotebookContent}
      uid="notebook-sidebar-uid"
      externalIPyWidgets={[
        { name: "@widgetti/jupyter-react", version: "0.3.0" },
        { name: "bqplot", version: "0.5.42" },
        { name: "jupyter-matplotlib", version: "0.11.3" },
      ]}
      height='calc(100vh - 2.6rem)' // (Height - Toolbar Height).
      cellSidebarMargin={160}
      CellSidebar={CellSidebarSource}
      Toolbar={NotebookToolbar}
    />
  </Jupyter>
)

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <NotebookCellSidebar/>
);
