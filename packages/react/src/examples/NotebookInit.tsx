/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { useNotebookStore2 } from '../components/notebook/Notebook2State';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { useJupyter } from '../jupyter';
import { CellSidebarExtension, Notebook2 } from '../components';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';

const NOTEBOOK_ID = 'notebook';

const NOTEBOOK_WIDTH = '100%';

const NOTEBOOK_HEIGHT = 500;

const IS_INITIALIZED = false;

const NotebookInitExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const notebookStore = useNotebookStore2();
  const notebook = notebookStore.selectNotebook2(NOTEBOOK_ID);
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  useEffect(() => {
    if (notebook && !IS_INITIALIZED) {
      /*
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
      */
    }
  }, [defaultKernel, notebook]);
  return (
    <JupyterReactTheme>
      <div style={{ width: NOTEBOOK_WIDTH, height: NOTEBOOK_HEIGHT }}>
        {serviceManager && defaultKernel && (
          <Notebook2
            path="ipywidgets.ipynb"
            id={NOTEBOOK_ID}
            kernel={defaultKernel}
            serviceManager={serviceManager}
            height={`calc(${NOTEBOOK_HEIGHT}px - 2.6rem)`}
            extensions={extensions}
            Toolbar={NotebookToolbar}
          />
        )}
      </div>
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookInitExample />);
