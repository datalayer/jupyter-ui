/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { CellSidebarButton } from '../components/notebook/cell/sidebar/CellSidebarButton';
import { Notebook2 } from '../components/notebook/Notebook2';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import { CellSidebarExtension } from '../components';

const NOTEBOOK_ID = 'notebook-id';

const COLORMODE = 'dark';

const NotebookNoContextExample = () => (
  <JupyterReactTheme colormode={COLORMODE}>
    <Notebook2
      id={NOTEBOOK_ID}
      startDefaultKernel
      path="ipywidgets.ipynb"
      height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
      extensions={[new CellSidebarExtension({ factory: CellSidebarButton })]}
      Toolbar={NotebookToolbar}
    />
  </JupyterReactTheme>
);

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookNoContextExample />);
