import { createRoot } from 'react-dom/client';
import Jupyter from '../jupyter/Jupyter';
import Notebook from '../components/notebook/Notebook';
import NotebookToolbar from "./toolbars/NotebookToolbar";
import CellSidebarNew from "../components/notebook/cell/sidebar/CellSidebarNew";

const Panel = () => {
  return (
    <Jupyter>
      <Notebook
        path="panel.ipynb"
        uid="notebook-panel-uid"
        height='calc(100vh - 2.6rem)' // (Height - Toolbar Height).
        CellSidebar={CellSidebarNew}
        Toolbar={NotebookToolbar}
      />
    </Jupyter>
  )
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <Panel/>
);
