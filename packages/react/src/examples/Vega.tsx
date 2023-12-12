/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { rendererFactory as vega3Renderer } from '@jupyterlab/vega3-extension';
import Jupyter from '../jupyter/Jupyter';
import Notebook from '../components/notebook/Notebook';
import NotebookToolbar from "./toolbars/NotebookToolbar";
import CellSidebarNew from "../components/notebook/cell/sidebar/CellSidebarButton";

const Vega = () => (
  <Jupyter>
    <Notebook
      path="vega/Vega.ipynb"
      uid="notebook-vega-uid"
      renderers={[
        vega3Renderer,
      ]}
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
  <Vega/>
);
