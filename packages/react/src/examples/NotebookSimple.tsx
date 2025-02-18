/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Copyright (c) 2021-2024 Datalayer, Inc.
 *
 * MIT License
 */
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { SimpleNotebook } from '../components/notebook/SimpleNotebook';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import { CellSidebar } from '../components/notebook/cell/sidebar/CellSidebar';
import { useJupyter } from '../jupyter';

import nbformat from './notebooks/NotebookExample1.ipynb.json';

const Notebook = () => {
  const { serviceManager } = useJupyter();
  return (
    serviceManager ?
      <JupyterReactTheme>
        <SimpleNotebook
          nbformat={nbformat as INotebookContent}
          id="notebook-nbformat-id"
          startDefaultKernel={true}
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          cellSidebarMargin={120}
          CellSidebar={CellSidebar}
          Toolbar={NotebookToolbar}
          collaborationServer={{
            baseURL: 'https://prod1.datalayer.run',
            token: '',
            roomName: '',
            type: 'datalayer'
          }}
          serviceManager={serviceManager}
        />
      </JupyterReactTheme>
    :
      <></>
  )
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<Notebook />);
