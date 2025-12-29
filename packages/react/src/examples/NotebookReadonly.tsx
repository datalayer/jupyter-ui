/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { useJupyter } from '../jupyter';
import { CellSidebarExtension } from '../components';
import { Notebook } from '../components/notebook/Notebook';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';

import NBFORMAT from './notebooks/NotebookExample1.ipynb.json';

const NotebookReadonlyExample = () => {
  const { serviceManager } = useJupyter({
    startDefaultKernel: false,
  });
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  return (
    <JupyterReactTheme>
      {serviceManager && (
        <Notebook
          readonly
          nbformat={NBFORMAT}
          serviceManager={serviceManager}
          extensions={extensions}
          id="notebook-model-id"
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          Toolbar={NotebookToolbar}
        />
      )}
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookReadonlyExample />);
