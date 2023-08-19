import { createRoot } from 'react-dom/client';
import { rendererFactory as geojsonRenderer } from '@jupyterlab/geojson-extension';
// import { rendererFactory as vega3Renderer } from '@jupyterlab/vega3-extension';
import Jupyter from '../jupyter/Jupyter';
import Notebook from '../components/notebook/Notebook';
import NotebookToolbar from "./toolbars/NotebookToolbar";
import CellSidebarNew from "../components/notebook/cell/sidebar/CellSidebarNew";

import "./../../style/index.css";

const GeoJson = () => (
  <Jupyter>
    <Notebook
      path="geojson-1.ipynb"
      renderers={[
        geojsonRenderer,
//        vega3Renderer,
      ]}
      uid="notebook-uid"
      height='calc(100vh - 2.6rem)' // (Height - Toolbar Height).
      CellSidebar={CellSidebarNew}
      Toolbar={NotebookToolbar}
    />
  </Jupyter>
)

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <GeoJson/>
);
