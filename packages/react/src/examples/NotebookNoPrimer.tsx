/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { CellSidebarExtension } from '../components';
import { CellSidebarButton } from '../components/notebook/cell/sidebar/CellSidebarButton';
import { Notebook } from '../components/notebook/Notebook';
import { JupyterLabCss } from '../theme';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';

const NOTEBOOK_ID = 'notebook-id';

const NotebookNoPrimerExample = () => (
  <>
    <JupyterLabCss colormode="dark" />
    <Notebook
      id={NOTEBOOK_ID}
      startDefaultKernel
      path="ipywidgets.ipynb"
      height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
      extensions={[new CellSidebarExtension({ factory: CellSidebarButton })]}
      Toolbar={NotebookToolbar}
    />
  </>
);

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookNoPrimerExample />);
