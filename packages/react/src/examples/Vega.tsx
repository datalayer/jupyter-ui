/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { rendererFactory as vega3Renderer } from '@jupyterlab/vega3-extension';
import { createRoot } from 'react-dom/client';
import { CellSidebarExtension } from '../components';
import CellSidebarButton from '../components/notebook/cell/sidebar/CellSidebarButton';
import { Notebook } from '../components/notebook/Notebook';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';

const VegaExample = () => (
  <JupyterReactTheme>
    <Notebook
      path="vega/Vega.ipynb"
      id="notebook-vega-id"
      renderers={[vega3Renderer]}
      height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
      extensions={[new CellSidebarExtension({ factory: CellSidebarButton })]}
      Toolbar={NotebookToolbar}
    />
  </JupyterReactTheme>
);

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<VegaExample />);
