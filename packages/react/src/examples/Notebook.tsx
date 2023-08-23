import { createRoot } from 'react-dom/client';
import Jupyter from '../jupyter/Jupyter';
import Notebook from '../components/notebook/Notebook';
import NotebookToolbar from "./toolbars/NotebookToolbar";
import CellSidebarNew from "../components/notebook/cell/sidebar/CellSidebarNew";

import "./../../style/index.css";

const NOTEBOOK_UID = 'notebook-uid';

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <Jupyter>
    <Notebook
      path="ipywidgets.ipynb"
      uid={NOTEBOOK_UID}
      externalIPyWidgets={[
        { name: "bqplot", version: "0.5.42" },
        { name: "jupyter-matplotlib", version: "0.11.3" },
        { name: "@widgetti/jupyter-react", version: "0.3.0" },
      ]}
      cellSidebarMargin={60}
      height='calc(100vh - 2.6rem)' // (Height - Toolbar Height).
      CellSidebar={CellSidebarNew}
      Toolbar={NotebookToolbar}
    />
  </Jupyter>
);
