/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { ServiceManager } from '@jupyterlab/services';
import { Button } from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import {
  getJupyterServerToken,
  getJupyterServerUrl,
  ServiceManagerLess,
} from '../jupyter';
import { JupyterReactTheme } from '../theme';
import { createServerSettings } from '../utils';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import { CellSidebarExtension } from '../components';
import { Notebook } from '../components/notebook/Notebook';

import NBFORMAT from './notebooks/NotebookExample1.ipynb.json';

const NotebookServiceManagerExample = () => {
  const [serverless, setServerless] = useState(true);
  const [readonly, setReadonly] = useState(true);
  const [serviceManager, setServiceManager] = useState(
    new ServiceManagerLess()
  );
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  const changeServiceManager = () => {
    if (serverless) {
      setServerless(false);
      setReadonly(false);
      const serverSettings = createServerSettings(
        getJupyterServerUrl(),
        getJupyterServerToken()
      );
      const serviceManager = new ServiceManager({ serverSettings });
      setServiceManager(serviceManager as any);
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
        <Box ml={3}>Token: {serviceManager.serverSettings.token}</Box>
      </Box>
      <Notebook
        id="notebook-model-id"
        serviceManager={serviceManager}
        startDefaultKernel={!serverless}
        extensions={extensions}
        nbformat={NBFORMAT as INotebookContent}
        readonly={readonly}
        height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
        Toolbar={NotebookToolbar}
      />
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookServiceManagerExample />);
