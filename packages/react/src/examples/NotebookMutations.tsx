/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { ServiceManager } from '@jupyterlab/services';
import { Box, SegmentedControl } from '@primer/react';
import { getJupyterServerUrl, getJupyterServerToken, createServerSettings, JupyterServiceManagerLess } from '../jupyter';
import { Notebook } from '../components/notebook/Notebook';
import { useNotebookStore } from './../components';
import { JupyterReactTheme } from '../themes/JupyterReactTheme';

import nbformat from './notebooks/NotebookExample1.ipynb.json';

const NOTEBOOK_ID = 'notebook-mutations-id';

const NotebookMutations = () => {
  const [index, setIndex] = useState(0);
  const [readonly, setReadonly] = useState(true);
  const [lite, setLite] = useState(false);
  const notebookStore = useNotebookStore();
  const notebook = notebookStore.selectNotebook(NOTEBOOK_ID);
  const [serviceManager, setServiceManager] = useState(new JupyterServiceManagerLess());
  const changeIndex = (index: number) => {
    setIndex(index);
    switch(index) {
      case 0: {
        setReadonly(true);
        setLite(false);
//        setServiceManager(new JupyterServiceManagerLess());
        break;
      }
      case 1: {
        setReadonly(false);
        setLite(true);
//        setServiceManager(new JupyterServiceManagerLess());
        break;
      }
      case 2: {
        setReadonly(false);
        setLite(false);
        /*
        const serverSettings = createServerSettings(getJupyterServerUrl(), getJupyterServerToken());
        const serviceManager = new ServiceManager({ serverSettings });
        setServiceManager(serviceManager);
        */
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
            <SegmentedControl.Button defaultSelected={index === 2}>CPU Kernel</SegmentedControl.Button>
          </SegmentedControl>
        </Box>
        <Box ml={3}>
          Readonly: {String(notebook?.adapter?.readonly)}
        </Box>
        <Box ml={3}>
          Lite: {String(notebook?.adapter?.lite)}
        </Box>
        <Box ml={3}>
          Kernel ID: {notebook?.adapter?.kernel.id}
        </Box>
        <Box ml={3}>
          Service Manager: {notebook?.adapter?.serviceManager.serverSettings.baseUrl}
        </Box>
      </Box>
      <Notebook
        readonly={readonly}
        lite={lite}
        serviceManager={serviceManager}
        nbformat={nbformat as INotebookContent}
        id={NOTEBOOK_ID}
        height="calc(100vh - 2.6rem)"
      />
    </JupyterReactTheme>
  );
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookMutations />);
