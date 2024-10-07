/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Box, SegmentedControl, Label } from '@primer/react';
import { INotebookContent } from '@jupyterlab/nbformat';
import { ServiceManager } from '@jupyterlab/services';
import { createLiteServiceManager, createServerSettings, setJupyterServerUrl, getJupyterServerUrl, getJupyterServerToken, ServiceManagerLess, loadJupyterConfig } from '../jupyter';
import { DEFAULT_JUPYTER_SERVER_URL } from '../jupyter';
import { useNotebookStore, Notebook } from './../components';
import { JupyterReactTheme } from '../theme';

import nb from './notebooks/NotebookExample1.ipynb.json';

const NOTEBOOK_ID = 'notebook-mutations-id';

loadJupyterConfig({});
// const serverSettings = createServerSettings(getJupyterServerUrl(), getJupyterServerToken());
// const SERVICE_MANAGER = new ServiceManager({ serverSettings });
const SERVICE_MANAGER = new ServiceManagerLess();

const NotebookMutations = () => {
  const [index, setIndex] = useState(0);
  const [nbformat, setNbformat] = useState(nb as INotebookContent);
  const [readonly, setReadonly] = useState(true);
  const [serverless, setServerless] = useState(true);
//  const [lite, setLite] = useState(false);
  const [serviceManager, setServiceManager] = useState<ServiceManager.IManager>(SERVICE_MANAGER);
  const notebookStore = useNotebookStore();
  const notebook = notebookStore.selectNotebook(NOTEBOOK_ID);
  const changeIndex = (index: number) => {
    setIndex(index);
    switch(index) {
      case 0: {
        setNbformat(notebook?.adapter?.notebookPanel?.content.model?.toJSON() as INotebookContent);
        setServerless(true);
        setReadonly(true);
//        setLite(false);
        const lessServiceManager = new ServiceManagerLess();
        setServiceManager(lessServiceManager);
        break;
      }
      case 1: { 
        setJupyterServerUrl(location.protocol + '//' + location.host);
        createLiteServiceManager().then(liteServiceManager => {
          console.log('Lite Service Manager is available', liteServiceManager);
          setServiceManager(liteServiceManager);
          setNbformat(notebook?.adapter?.notebookPanel?.content.model?.toJSON() as INotebookContent);
          setServerless(false);
          setReadonly(false);
//          setLite(true);
        });
        break;
      }
      case 2: {
        setJupyterServerUrl(DEFAULT_JUPYTER_SERVER_URL);
        setNbformat(notebook?.adapter?.notebookPanel?.content.model?.toJSON() as INotebookContent);
        setServerless(false);
        setReadonly(false);
//        setLite(false);
        const serverSettings = createServerSettings(getJupyterServerUrl(), getJupyterServerToken());
        const serviceManager = new ServiceManager({ serverSettings });
        (serviceManager as any)['__NAME__'] = 'MutatingServiceManager';
        setServiceManager(serviceManager);
        break;
      }
    }
  }
  return (
    <JupyterReactTheme>
      <Box display="flex">
        <Box>
          <SegmentedControl onChange={index => changeIndex(index)} aria-label="jupyter-react-example">
            <SegmentedControl.Button defaultSelected={index === 0}>Readonly</SegmentedControl.Button>
            <SegmentedControl.Button defaultSelected={index === 1}>Browser Kernel</SegmentedControl.Button>
            <SegmentedControl.Button defaultSelected={index === 2}>OSS Kernel (CPU)</SegmentedControl.Button>
            <SegmentedControl.Button defaultSelected={index === 3}>Kernel (CPU)</SegmentedControl.Button>
            <SegmentedControl.Button defaultSelected={index === 4}>Kernel (GPU)</SegmentedControl.Button>
          </SegmentedControl>
        </Box>
        <Box ml={1} mt={1}>
          <Label>Readonly: {String(notebook?.adapter?.readonly)}</Label>
          <Label>Serverless: {String(notebook?.adapter?.serverless)}</Label>
          <Label>Lite: {String(notebook?.adapter?.lite)}</Label>
          <Label>Service Manager URL: {notebook?.adapter?.serviceManager.serverSettings.baseUrl}</Label>
          <Label>Service Manager is ready: {String(notebook?.adapter?.serviceManager.isReady)}</Label>
          <Label>Kernel ID: {notebook?.adapter?.kernel?.id}</Label>
          <Label>Kernel Banner: {notebook?.adapter?.kernel?.info?.banner}</Label>
        </Box>
      </Box>
      <Notebook
        height="calc(100vh - 2.6rem)"
        id={NOTEBOOK_ID}
//        lite={lite}
        nbformat={nbformat as INotebookContent}
        readonly={readonly}
        serverless={serverless}
        serviceManager={serviceManager}
      />
    </JupyterReactTheme>
  );
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookMutations />);
