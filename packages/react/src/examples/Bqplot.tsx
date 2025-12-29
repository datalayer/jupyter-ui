/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { useJupyter } from '../jupyter';
import { CellSidebarExtension } from '../components';
import { Notebook2 } from '../components/notebook/Notebook2';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';

const BqplotExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  return (
    <JupyterReactTheme>
      {serviceManager && defaultKernel && (
        <Notebook2
          id="notebook-bqplot-id"
          path="bqplot.ipynb"
          kernel={defaultKernel}
          serviceManager={serviceManager}
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          Toolbar={NotebookToolbar}
          extensions={extensions}
        />
      )}
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<BqplotExample />);
