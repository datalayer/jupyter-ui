/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import {Jupyter, Notebook} from '@datalayer/jupyter-react';
import {Box} from '@primer/react';
import NotebookToolbar from './notebook/NotebookToolbar';
import CellSidebar from './notebook/cell/CellSidebar';

const NOTEBOOK_UID = 'notebook-id-simple';

export default function NotebookSidebarComponent() {
  return (
    <Jupyter startDefaultKernel collaborative={false} terminals>
      <div style={{padding: '2rem'}}>
        <Box sx={{width: '100%'}}>
          <NotebookToolbar notebookId={NOTEBOOK_UID} />
          <Notebook
            path=".datalayer/ping.ipynb"
            id={NOTEBOOK_UID}
            CellSidebar={CellSidebar}
          />
        </Box>
      </div>
    </Jupyter>
  );
}
