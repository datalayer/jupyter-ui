/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { rendererFactory as vega3Renderer } from '@jupyterlab/vega3-extension';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { Notebook } from '../components/notebook/Notebook';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import CellSidebarButton from '../components/notebook/cell/sidebar/CellSidebarButton';

const Vega = () => (
  <JupyterReactTheme>
    <Notebook
      path="vega/Vega.ipynb"
      id="notebook-vega-id"
      renderers={[vega3Renderer]}
      height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
      CellSidebar={CellSidebarButton}
      Toolbar={NotebookToolbar}
    />
  </JupyterReactTheme>
);

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<Vega />);
