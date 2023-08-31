import { createRoot } from 'react-dom/client';
import Jupyter from '../jupyter/Jupyter';
import Notebook from '../components/notebook/Notebook';
import NotebookToolbar from "./toolbars/NotebookToolbar";
import CellSidebarNew from "../components/notebook/cell/sidebar/CellSidebarNew";

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
        { name: "@widgetti/jupyter-react", version: "0.3.0" },
        { name: "bqplot", version: "0.5.42" },
        { name: "jupyter-matplotlib", version: "0.11.3" },
      ]}
      height='calc(100vh - 2.6rem)' // (Height - Toolbar Height).
      cellSidebarMargin={60}
      CellSidebar={CellSidebarNew}
      Toolbar={NotebookToolbar}
    />
  </Jupyter>
);
