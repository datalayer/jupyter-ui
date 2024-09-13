/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { ServiceManager } from '@jupyterlab/services';
import { Button , Box } from '@primer/react';
import { JupyterReactTheme } from '../theme';
import { createServerSettings } from '../jupyter/JupyterContext';
import { getJupyterServerUrl, getJupyterServerToken, ServiceManagerLess } from '../jupyter';
import { Notebook } from '../components/notebook/Notebook';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import { CellSidebar } from '../components/notebook/cell/sidebar/CellSidebar';

import nbformat from './notebooks/NotebookExample1.ipynb.json';

const NotebookServiceManager = () => {
  const [serverless, setServerless] = useState(true);
  const [readonly, setReadonly] = useState(true);
  const [serviceManager, setServiceManager] = useState(new ServiceManagerLess());
  const changeServiceManager = () => {
    if (serverless) {
      setServerless(false);
      setReadonly(false);  
      const serverSettings = createServerSettings(getJupyterServerUrl(), getJupyterServerToken());
      const serviceManager = new ServiceManager({ serverSettings });
      setServiceManager(serviceManager);
    } else {
      setServerless(true);
      setReadonly(true);  
      const serviceManager = new ServiceManagerLess();
      setServiceManager(serviceManager);
    }
  };
  return (
    <JupyterReactTheme>
      <Box display="flex">
        <Box>
          <Button onClick={e => changeServiceManager()}>
            Change the Service Manager
          </Button>
        </Box>
        <Box ml={3}>
          Token: {serviceManager.serverSettings.token}
        </Box>
      </Box>
      <Notebook
        nbformat={nbformat as INotebookContent}
        serviceManager={serviceManager}
        serverless={serverless}
        readonly={readonly}
        id="notebook-model-id"
        height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
        cellSidebarMargin={120}
        CellSidebar={CellSidebar}
        Toolbar={NotebookToolbar}
      />
    </JupyterReactTheme>
  );
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookServiceManager />);
