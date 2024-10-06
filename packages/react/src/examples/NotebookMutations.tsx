/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Box, SegmentedControl, Label } from '@primer/react';
import { INotebookContent } from '@jupyterlab/nbformat';
import { ServiceManager } from '@jupyterlab/services';
import { createServiceManagerLite, createServerSettings, getJupyterServerUrl, getJupyterServerToken, ServiceManagerLess, loadJupyterConfig } from '../jupyter';
import { useNotebookStore, Notebook} from './../components';
import { JupyterReactTheme } from '../theme';

import nbformat from './notebooks/NotebookExample1.ipynb.json';

const NOTEBOOK_ID = 'notebook-mutations-id';

loadJupyterConfig({});

const NotebookMutations = () => {
  const [index, setIndex] = useState(0);
  const [readonly, setReadonly] = useState(true);
  const [lite, setLite] = useState(false);
  const [serviceManager, setServiceManager] = useState<ServiceManager.IManager>(new ServiceManagerLess());
  const notebookStore = useNotebookStore();
  const adapter = notebookStore.selectNotebookAdapter(NOTEBOOK_ID);
  const changeIndex = (index: number) => {
    setIndex(index);
    switch(index) {
      case 0: {
        setReadonly(true);
        setLite(false);
        const serviceManager = new ServiceManagerLess();
        setServiceManager(serviceManager);
        break;
      }
      case 1: {
        setReadonly(false);
        setLite(true);
        createServiceManagerLite().then(listServiceManager => {
          console.log('Service Manager Lite is created', listServiceManager);
          setServiceManager(listServiceManager);
        });
        break;
      }
      case 2: {
        setReadonly(false);
        setLite(false);
        const serverSettings = createServerSettings(getJupyterServerUrl(), getJupyterServerToken());
        const serviceManager = new ServiceManager({ serverSettings });
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
          <Label>Readonly: {String(adapter?.readonly)}</Label>
          <Label>Serverless: {String(adapter?.serverless)}</Label>
          <Label>Lite: {String(adapter?.lite)}</Label>
          <Label>Service Manager URL: {adapter?.serviceManager.serverSettings.baseUrl}</Label>
          <Label>Service Manager is ready: {String(adapter?.serviceManager.isReady)}</Label>
          <Label>Kernel ID: {adapter?.kernel?.id}</Label>
          <Label>Kernel Banner: {adapter?.kernel?.info?.banner}</Label>
        </Box>
      </Box>
      <Notebook
        height="calc(100vh - 2.6rem)"
        id={NOTEBOOK_ID}
        lite={lite}
        nbformat={nbformat as INotebookContent}
        readonly={readonly}
        serviceManager={serviceManager}
      />
    </JupyterReactTheme>
  );
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookMutations />);
