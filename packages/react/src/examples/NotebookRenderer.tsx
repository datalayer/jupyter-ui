import { createRoot } from 'react-dom/client';
import { rendererFactory as geojsonRenderer } from '@jupyterlab/geojson-extension';
// import { rendererFactory as vega3Renderer } from '@jupyterlab/vega3-extension';
import Jupyter from '../jupyter/Jupyter';
import Notebook from '../components/notebook/Notebook';
import NotebookToolbar from "./toolbars/NotebookToolbar";
import CellSidebarNew from "../components/notebook/cell/sidebar/CellSidebarNew";

import "./../../style/index.css";

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <Jupyter>
    <Notebook
      path="renderer.ipynb"
      renderers={[
        geojsonRenderer,
//        vega3Renderer,
      ]}
      CellSidebar={CellSidebarNew}
      Toolbar={NotebookToolbar}
      height='calc(100vh - 2.6rem)' // (Height - Toolbar Height).
      uid="notebook-uid"
    />
  </Jupyter>
);
