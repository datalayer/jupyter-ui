/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { useJupyter } from '../jupyter';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { CellSidebarExtension, Notebook } from '../components';
import { useNotebookStore } from '../components/notebook/NotebookState';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';

const NOTEBOOK_ID = 'notebook';

const NOTEBOOK_WIDTH = '100%';

const NOTEBOOK_HEIGHT = 500;

let IS_INITIALIZED = false;

const NotebookInitExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const notebookStore = useNotebookStore();
  const notebook = notebookStore.selectNotebook(NOTEBOOK_ID);
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  useEffect(() => {
    if (notebook && !IS_INITIALIZED) {
      notebook.adapter?.panel?.model?.contentChanged.connect(_ => {
        if (!IS_INITIALIZED) {
          IS_INITIALIZED = true;
          // console.log("You can use one of these commands:", notebook.adapter?.commands.listCommands());
          // notebook.adapter?.commands.execute("notebook:run-all");
          notebookStore.insertAbove(
            NOTEBOOK_ID,
            'code',
            'print("Hello 🪐 ⚛️ Jupyter React")'
          );
        }
      });
    }
  }, [defaultKernel, notebook]);
  return (
    <JupyterReactTheme>
      <div style={{ width: NOTEBOOK_WIDTH, height: NOTEBOOK_HEIGHT }}>
        {serviceManager && defaultKernel && (
          <Notebook
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
