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
import {
  createLiteServiceManager, createServerSettings, setJupyterServerUrl, getJupyterServerUrl,
  getJupyterServerToken, ServiceManagerLess, loadJupyterConfig, DEFAULT_JUPYTER_SERVER_URL,
} from '../jupyter';
import { useJupyterReactStore } from '../state';
import { useNotebookStore, Notebook, SpinnerCentered } from './../components';
import { JupyterReactTheme } from '../theme';
import { createDatalayerServiceManager } from './../providers';

import nbformatExample from './notebooks/NotebookExample1.ipynb.json';

const NOTEBOOK_ID = 'notebook-mutations-id';

loadJupyterConfig({});

const SERVICE_MANAGER_LESS = new ServiceManagerLess();

const NotebookMutations = () => {
  const [index, setIndex] = useState(0);
  const [nbformat, setNbformat] = useState(nbformatExample as INotebookContent);
  const [readonly, setReadonly] = useState(true);
  const [serverless, setServerless] = useState(true);
  const [kernelIndex, setKernelIndex] = useState(-1);
  const [waiting, setWaiting] = useState(false);
//  const [lite, setLite] = useState(false);
  const [serviceManager, setServiceManager] = useState<ServiceManager.IManager>(SERVICE_MANAGER_LESS);
  const jupyterReactStore = useJupyterReactStore();
  const notebookStore = useNotebookStore();
  const notebook = notebookStore.selectNotebook(NOTEBOOK_ID);
  const changeIndex = (index: number) => {
    setIndex(index);
    switch(index) {
      case 0: {
        setKernelIndex(-1);
        setNbformat(notebook?.adapter?.notebookPanel?.content.model?.toJSON() as INotebookContent);
        setServerless(true);
        setReadonly(true);
//        setLite(false);
        setServiceManager(SERVICE_MANAGER_LESS);
        break;
      }
      case 1: {
        setJupyterServerUrl(location.protocol + '//' + location.host);
        createLiteServiceManager().then(liteServiceManager => {
          setKernelIndex(-1);
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
        setKernelIndex(-1);
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
      case 3: {
//        setWaiting(true);
//        setLite(false);
        createDatalayerServiceManager(jupyterReactStore.datalayerConfig?.cpuEnvironment || 'python-simple-env').then((serviceManager) => {
          (serviceManager as any)['__NAME__'] = 'DatalayerCPUServiceManager';
          setServiceManager(serviceManager);
          setServerless(false);
          setReadonly(false);
          setKernelIndex(0);
          setNbformat(notebook?.adapter?.notebookPanel?.content.model?.toJSON() as INotebookContent);
//          setWaiting(false);  
        });
        break;
      }
      case 4: {
        setWaiting(true);
//        setLite(false);
        createDatalayerServiceManager(jupyterReactStore.datalayerConfig?.gpuEnvironment || 'pytorch-cuda-env').then((serviceManager) => {
          setKernelIndex(0);
          (serviceManager as any)['__NAME__'] = 'DatalayerGPUServiceManager';
          setServiceManager(serviceManager);
          setNbformat(notebook?.adapter?.notebookPanel?.content.model?.toJSON() as INotebookContent);
          setServerless(false);
          setReadonly(false);
          setWaiting(false);  
        });
        break;
      }
    }
  }
  return (
    <JupyterReactTheme>
      <>
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
            {/*
            <Label>Readonly: {String(notebook?.adapter?.readonly)}</Label>
            <Label>Serverless: {String(notebook?.adapter?.serverless)}</Label>
            */}
            <Label>Lite: {String(notebook?.adapter?.lite)}</Label>
            <Label>Service Manager URL: {notebook?.adapter?.serviceManager.serverSettings.baseUrl}</Label>
            <Label>Service Manager is ready: {String(notebook?.adapter?.serviceManager.isReady)}</Label>
            <Label>Kernel ID: {notebook?.adapter?.kernel?.id}</Label>
            <Label>Kernel Banner: {notebook?.adapter?.kernel?.info?.banner}</Label>
          </Box>
        </Box>
        {waiting
          ?
            <SpinnerCentered/>
          :
          <Notebook
            height="calc(100vh - 2.6rem)"
            id={NOTEBOOK_ID}
//            lite={lite}
            nbformat={nbformat as INotebookContent}
            readonly={readonly}
            serverless={serverless}
            serviceManager={serviceManager}
            useRunningKernelIndex={kernelIndex}
          />
        }
      </>
    </JupyterReactTheme>
  );
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookMutations />);
