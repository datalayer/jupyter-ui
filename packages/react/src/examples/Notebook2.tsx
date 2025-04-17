/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { useJupyter } from '../jupyter';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import { Notebook2 } from '../components/notebook/Notebook2';

import nbformat from './notebooks/NotebookExample1.ipynb.json';

const Notebook = () => {
  const { serviceManager } = useJupyter();
  return (
    serviceManager ?
      <JupyterReactTheme>
        <Notebook2
          nbformat={nbformat as INotebookContent}
          id="notebook-nbformat-id"
          startDefaultKernel={true}
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          cellSidebarMargin={120}
          Toolbar={NotebookToolbar}
          /*
          collaborationServer={{
            baseURL: 'https://prod1.datalayer.run',
            token: '',
            roomName: '',
            type: 'datalayer'
          }}
          */
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
