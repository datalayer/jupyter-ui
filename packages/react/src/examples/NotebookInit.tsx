/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useNotebookStore } from '../components/notebook/NotebookState';
import { useJupyter, Jupyter, Kernel } from '../jupyter';
import { CellSidebarExtension, Notebook } from '../components';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';

const NOTEBOOK_ID = 'notebook';

const NOTEBOOK_WIDTH = '100%';

const NOTEBOOK_HEIGHT = 500;

const KERNEL_NAME = 'python';

let IS_INITIALIZED = false;

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
        kernelName: KERNEL_NAME,
        kernelSpecName: KERNEL_NAME,
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

const NotebookInitExample = () => {
  const kernel = useKernel();
  const notebookStore = useNotebookStore();
  const notebook = notebookStore.selectNotebook(NOTEBOOK_ID);
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  useEffect(() => {
    if (notebook && !IS_INITIALIZED) {
      notebook.adapter?.notebookPanel?.model?.contentChanged.connect(_ => {
        if (!IS_INITIALIZED) {
          IS_INITIALIZED = true;
          //          console.log("You can use one of these commands:", notebook.adapter?.commands.listCommands());
          //          notebook.adapter?.commands.execute("notebook:run-all");
          notebookStore.insertAbove({
            id: NOTEBOOK_ID,
            cellType: 'code',
            source: 'print("Hello 🪐 ⚛️ Jupyter React")',
          });
        }
      });
    }
  }, [kernel, notebook]);
  return (
    <Jupyter startDefaultKernel={false}>
      <div style={{ width: NOTEBOOK_WIDTH, height: NOTEBOOK_HEIGHT }}>
        {kernel ? (
          <Notebook2
            path="ipywidgets.ipynb"
            id={NOTEBOOK_ID}
            kernel={kernel}
            height={`calc(${NOTEBOOK_HEIGHT}px - 2.6rem)`}
            extensions={extensions}
            Toolbar={NotebookToolbar}
          />
        ) : (
          <></>
        )}
        ;
      </div>
    </Jupyter>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookInitExample />);
