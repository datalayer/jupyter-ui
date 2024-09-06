/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { ServiceManager } from '@jupyterlab/services';
import Jupyter from '../jupyter/Jupyter';
import { createServerSettings } from '../jupyter/JupyterContext';
import { getJupyterServerUrl, getJupyterServerToken } from '../jupyter/JupyterConfig';
import JupyterServiceManagerLess from '../jupyter/services/JupyterServiceManagerLess';
import { Kernel } from '../jupyter/kernel/Kernel';
import Notebook from '../components/notebook/Notebook';
import NotebookToolbar from './toolbars/NotebookToolbar';
import CellSidebar from '../components/notebook/cell/sidebar/CellSidebar';

import nbformat from './notebooks/NotebookExample1.ipynb.json';

const KERNEL_NAME = 'python3';

const NotebookServiceManager = () => {
  const [serviceManagerLess, _] = useState(new JupyterServiceManagerLess());
  const [kernel, setKernel] = useState<Kernel>();
  useEffect(() => {
    const serverSettings = createServerSettings(getJupyterServerUrl(), getJupyterServerToken());
    const serviceManager = new ServiceManager({ serverSettings });
    const kernel = new Kernel({
      kernelManager: serviceManager.kernels,
      kernelName: KERNEL_NAME,
      kernelSpecName: KERNEL_NAME,
      kernelspecsManager: serviceManager.kernelspecs,
      sessionManager: serviceManager.sessions,
    });
    setKernel(kernel);
  }, [])
  return (
    <Jupyter
      serviceManager={serviceManagerLess}
    >
      <Notebook
        nbformat={nbformat as INotebookContent}
        kernel={kernel}
        id="notebook-model-id"
        height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
        cellSidebarMargin={120}
        CellSidebar={CellSidebar}
        Toolbar={NotebookToolbar}
      />
    </Jupyter>
  );
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookServiceManager />);
