/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import {
  BaseStyles,
  ThemeProvider,
  theme,
} from '@primer/react';
import Notebook from '../components/notebook/Notebook';
import NotebookToolbar from './toolbars/NotebookToolbar';
import CellSidebar from '../components/notebook/cell/sidebar/CellSidebarButton';
import JupyterLabCss from './../jupyter/lab/JupyterLabCss';

const NOTEBOOK_UID = 'notebook-uid';

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

const colorMode = 'light';

root.render(
  <>
    <JupyterLabCss colorMode={colorMode} />
    <ThemeProvider
      theme={theme}
      colorMode={colorMode === 'light' ? 'day' : 'night'}
      dayScheme="light"
      nightScheme="dark"
    >
      <BaseStyles>
        <Notebook
          path="ipywidgets.ipynb"
          uid={NOTEBOOK_UID}
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          cellSidebarMargin={60}
          CellSidebar={CellSidebar}
          Toolbar={NotebookToolbar}
        />
      </BaseStyles>
    </ThemeProvider>
  </>
);
