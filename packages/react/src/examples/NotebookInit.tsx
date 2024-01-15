/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  createInjectableStore,
  createReduxEpicStore,
  useJupyter,
  notebookActions,
  selectNotebook,
  CellSidebar,
  IJupyterReactState,
  Jupyter,
  Kernel,
  Notebook,
} from '../index';
import NotebookToolbar from './toolbars/NotebookToolbar';

const NOTEBOOK_ID = 'notebook';
const NOTEBOOK_WIDTH = '100%';
const NOTEBOOK_HEIGHT = 500;
const JUPYTER_KERNEL_NAME = 'python';

let IS_INITIALIZED = false;

const jupyterStore = createReduxEpicStore();
const injectableStore = createInjectableStore(jupyterStore);

injectableStore.inject('init', (state: IJupyterReactState, _action: any) => {
  return state || {};
});

const useKernel = () => {
  const { kernelManager, serviceManager } = useJupyter();
  const [kernel, setKernel] = useState<Kernel>();
  useEffect(() => {
    if (!serviceManager) {
      return;
    }
    let startedKernel: Kernel;
    kernelManager?.ready.then(() => {
      const customKernel = new Kernel({
        kernelManager,
        kernelName: JUPYTER_KERNEL_NAME,
        kernelSpecName: JUPYTER_KERNEL_NAME,
        kernelType: 'notebook',
        kernelspecsManager: serviceManager.kernelspecs,
        sessionManager: serviceManager.sessions,
      });
      customKernel.ready.then(() => {
        startedKernel = customKernel;
        setKernel(customKernel);
      });
    });
    return () => {
      if (startedKernel) {
        kernelManager?.shutdown(startedKernel.id).then();
      }
    };
  }, [kernelManager, serviceManager]);
  return kernel;
};

const NotebookInit: React.FC = () => {
  const kernel = useKernel();
  const notebook = selectNotebook(NOTEBOOK_ID);
  useEffect(() => {
    if (notebook && !IS_INITIALIZED) {
      notebook.adapter?.notebookPanel?.model?.contentChanged.connect(_ => {
        if (!IS_INITIALIZED) {
          IS_INITIALIZED = true;
          //          console.log("You can use one of these commands:", notebook.adapter?.commands.listCommands());
          //          notebook.adapter?.commands.execute("notebook:run-all");
          injectableStore.dispatch(
            notebookActions.insertAbove.started({
              uid: NOTEBOOK_ID,
              cellType: 'code',
              source: 'print("Hello 🪐 ⚛️ Jupyter React")',
            })
          );
        }
      });
    }
  }, [kernel, notebook]);
  return kernel ? (
    <Notebook
      path="ipywidgets.ipynb"
      uid={NOTEBOOK_ID}
      kernel={kernel}
      height={`calc(${NOTEBOOK_HEIGHT}px - 2.6rem)`}
      CellSidebar={CellSidebar}
      Toolbar={NotebookToolbar}
    />
  ) : (
    <></>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <Jupyter injectableStore={injectableStore} startDefaultKernel={false}>
    <div style={{ width: NOTEBOOK_WIDTH, height: NOTEBOOK_HEIGHT }}>
      <NotebookInit />
    </div>
  </Jupyter>
);
