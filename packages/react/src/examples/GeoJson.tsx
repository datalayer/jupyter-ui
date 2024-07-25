/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { rendererFactory as geojsonRenderer } from '@jupyterlab/geojson-extension';
import Jupyter from '../jupyter/Jupyter';
import Notebook from '../components/notebook/Notebook';
import NotebookToolbar from './toolbars/NotebookToolbar';
import CellSidebarNew from '../components/notebook/cell/sidebar/CellSidebarButton';

const GeoJson = () => (
  <Jupyter>
    <Notebook
      path="renderers/geojson-1.ipynb"
      id="notebook-geojson-id"
      renderers={[geojsonRenderer]}
      height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
      CellSidebar={CellSidebarNew}
      Toolbar={NotebookToolbar}
    />
  </Jupyter>
);

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<GeoJson />);
