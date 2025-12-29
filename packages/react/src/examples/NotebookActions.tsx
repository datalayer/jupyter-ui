/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { ActionBar } from '@primer/react/experimental';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlayIcon,
} from '@primer/octicons-react';
import { INotebookContent } from '@jupyterlab/nbformat';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { useJupyter } from '../jupyter';
import {
  useNotebookStore,
  Notebook,
  CellSidebarExtension,
  CellSidebarButton,
} from '../components';
import { CellToolbarExtension } from './extensions';

import NBFORMAT from './notebooks/NotebookExample1.ipynb.json';

const NOTEBOOK_ID = 'notebook-nbformat-id';

const NotebookActionsExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const notebookStore = useNotebookStore();
  const extensions = useMemo(
    () => [
      new CellToolbarExtension(),
      new CellSidebarExtension({ factory: CellSidebarButton }),
    ],
    []
  );
  return (
    <>
      <ActionBar aria-label="Toolbar">
        <ActionBar.IconButton
          icon={PlayIcon}
          aria-label="Run"
          onClick={() => notebookStore.run(NOTEBOOK_ID)}
        />
        <ActionBar.Divider />
        <ActionBar.IconButton
          icon={ChevronUpIcon}
          aria-label="Insert Code"
          onClick={() => notebookStore.insertAbove(NOTEBOOK_ID, 'code')}
        />
        <ActionBar.IconButton
          icon={ChevronDownIcon}
          aria-label="Insert Code"
          onClick={() => notebookStore.insertBelow(NOTEBOOK_ID, 'code')}
        />
      </ActionBar>
      <JupyterReactTheme>
        {serviceManager && defaultKernel && (
          <Notebook
            id={NOTEBOOK_ID}
            nbformat={NBFORMAT as INotebookContent}
            serviceManager={serviceManager}
            kernel={defaultKernel}
            height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
            extensions={extensions}
          />
        )}
      </JupyterReactTheme>
    </>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookActionsExample />);
