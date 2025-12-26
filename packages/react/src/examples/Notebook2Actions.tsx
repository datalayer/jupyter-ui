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
  useNotebookStore2,
  Notebook2,
  CellSidebarExtension,
  CellSidebarButton,
} from '../components';
import { CellToolbarExtension } from './extensions';

import NBFORMAT from './notebooks/NotebookExample1.ipynb.json';

const NOTEBOOK_ID = 'notebook-nbformat-id';

const Notebook2ActionsExample = () => {
  const { serviceManager } = useJupyter();
  const runStore2 = useNotebookStore2();

  const extensions = useMemo(
    () => [
      new CellToolbarExtension(),
      new CellSidebarExtension({ factory: CellSidebarButton }),
    ],
    []
  );

  return serviceManager ? (
    <>
      <ActionBar aria-label="Toolbar">
        <ActionBar.IconButton
          icon={PlayIcon}
          aria-label="Run"
          onClick={() => runStore2.run(NOTEBOOK_ID)}
        ></ActionBar.IconButton>
        <ActionBar.Divider />
        <ActionBar.IconButton
          icon={ChevronUpIcon}
          aria-label="Insert Code"
          onClick={() => runStore2.insertAbove(NOTEBOOK_ID, 'code')}
        ></ActionBar.IconButton>
        <ActionBar.IconButton
          icon={ChevronDownIcon}
          aria-label="Insert Code"
          onClick={() => runStore2.insertBelow(NOTEBOOK_ID, 'code')}
        ></ActionBar.IconButton>
      </ActionBar>
      <JupyterReactTheme>
        <Notebook2
          nbformat={NBFORMAT as INotebookContent}
          id={NOTEBOOK_ID}
          startDefaultKernel
          serviceManager={serviceManager}
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          extensions={extensions}
        />
      </JupyterReactTheme>
    </>
  ) : (
    <></>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<Notebook2ActionsExample />);
