/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { ServiceManager } from '@jupyterlab/services';
import { SegmentedControl } from '@primer/react';
import { JupyterServiceManagerLess } from '../jupyter';
import { createServerSettings } from '../jupyter/JupyterContext';
import { getJupyterServerUrl, getJupyterServerToken } from '../jupyter/JupyterConfig';
import JupyterReactTheme from '../themes/JupyterReactTheme';
import Notebook from '../components/notebook/Notebook';

import nbformat1 from './notebooks/NotebookExample1.ipynb.json';
import nbformat2 from './notebooks/NotebookExample2.ipynb.json';

const NotebookEvolving = () => {
  const [index, setIndex] = useState(0);
  const [readonly, setReadonly] = useState(true);
  const [lite, setLite] = useState(false);
  const [nbformat, setNbformat] = useState<INotebookContent>(nbformat1);
  const [serviceManager, setServiceManager] = useState(new JupyterServiceManagerLess());
  const changeIndex = (index: number) => {
    setIndex(index);
    switch(index) {
      case 0: {
        setReadonly(true);
        setLite(false);
        setNbformat(nbformat1)
        setServiceManager(new JupyterServiceManagerLess());
        break;
      }
      case 1: {
        setReadonly(false);
        setLite(true);
        setNbformat(nbformat2)
        setServiceManager(new JupyterServiceManagerLess());
        break;
      }
      case 2: {
        setReadonly(false);
        setLite(false);
        setNbformat(nbformat2)
        const serverSettings = createServerSettings(getJupyterServerUrl(), getJupyterServerToken());
        const serviceManager = new ServiceManager({ serverSettings });
        setServiceManager(serviceManager);
        break;
      }
    }
  }
  return (
    <JupyterReactTheme>
      <SegmentedControl onChange={index => changeIndex(index)} aria-label="jupyter-react-example">
        <SegmentedControl.Button defaultSelected={index === 0}>Readonly</SegmentedControl.Button>
        <SegmentedControl.Button defaultSelected={index === 1}>Browser Kernel</SegmentedControl.Button>
        <SegmentedControl.Button defaultSelected={index === 2}>CPU Kernel</SegmentedControl.Button>
      </SegmentedControl>
      <Notebook
        readonly={readonly}
        lite={lite}
        serviceManager={serviceManager}
        nbformat={nbformat}
        id="notebook-evolving-id"
        height="calc(100vh - 2.6rem)"
      />
    </JupyterReactTheme>
  );
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookEvolving />);
