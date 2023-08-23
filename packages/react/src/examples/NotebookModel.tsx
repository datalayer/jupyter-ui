import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import Jupyter from '../jupyter/Jupyter';
import Notebook from '../components/notebook/Notebook';
import NotebookToolbar from "./toolbars/NotebookToolbar";
import CellSidebarDefault from "../components/notebook/cell/sidebar/CellSidebarDefault";

import notebook from "./samples/NotebookExample1.ipynb.json";

import "./../../style/index.css";

const NotebookModel = () => (
  <Jupyter>
    <Notebook
      nbformat={notebook as INotebookContent}
      uid="notebook-model-uid"
      externalIPyWidgets={[
        { name: "bqplot", version: "0.5.42" },
        { name: "jupyter-matplotlib", version: "0.11.3" },
        { name: "@widgetti/jupyter-react", version: "0.3.0" },
      ]}
      cellSidebarMargin={120}
      height='calc(100vh - 2.6rem)' // (Height - Toolbar Height).
      CellSidebar={CellSidebarDefault}
      Toolbar={NotebookToolbar}
    />
  </Jupyter>
)

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <NotebookModel/>
);
