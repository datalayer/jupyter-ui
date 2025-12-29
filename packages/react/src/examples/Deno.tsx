/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { CellSidebarExtension } from '../components';
import { Notebook2 } from '../components/notebook/Notebook2';
import { useJupyter } from '../jupyter';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';

const DenoExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
    defaultKernelName: 'deno',
  });
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  return (
    <JupyterReactTheme>
      {serviceManager && defaultKernel && (
        <Notebook2
          id="notebook-deno-id"
          kernel={defaultKernel}
          serviceManager={serviceManager}
          url="https://raw.githubusercontent.com/rgbkrk/denotebooks/f173b472ad5b0169d77818027bf662682c5024ec/10.2_Polar%20DataFrames.ipynb"
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          extensions={extensions}
          Toolbar={NotebookToolbar}
        />
      )}
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<DenoExample />);
