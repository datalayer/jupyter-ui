import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import Jupyter from '../jupyter/Jupyter';
import Notebook from '../components/notebook/Notebook';
import NotebookToolbar from "./toolbars/NotebookToolbar";
import CellSidebarDefault from "../components/notebook/cell/sidebar/CellSidebarDefault";

import notebookExample from "./notebooks/IPyWidgetsExample1.ipynb.json";

import "./../../style/index.css";

const IPyWidgets = () => (
  <Jupyter
    lite={false}
    useRunningKernelIndex={-1}
    startDefaultKernel={true}
    terminals={false}
  >
    <Notebook
      nbformat={notebookExample as INotebookContent}
      CellSidebar={CellSidebarDefault}
      Toolbar={NotebookToolbar} 
      height='calc(100vh - 2.6rem)' // (Height - Toolbar Height).
      cellSidebarMargin={120}
      uid="notebook-uid"
    />
  </Jupyter>
)

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <IPyWidgets/>
);
