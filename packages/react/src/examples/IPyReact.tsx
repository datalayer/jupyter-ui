import { createRoot } from 'react-dom/client';
import Jupyter from '../jupyter/Jupyter';
import Notebook from '../components/notebook/Notebook';
import NotebookToolbar from "./toolbars/NotebookToolbar";
import CellSidebarDefault from "../components/notebook/cell/sidebar/CellSidebarDefault";

const IPyReact = () => (
  <Jupyter>
    <Notebook
      path="ipyreact.ipynb"
      uid="notebook-ipyreact-uid"
      externalIPyWidgets={[
        { name: "@widgetti/jupyter-react", version: "0.3.0" },
      ]}
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
  <IPyReact/>
);
