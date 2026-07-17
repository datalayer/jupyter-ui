/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { useJupyter } from '../jupyter';
import { ExampleJupyterReactTheme } from './ExampleJupyterReactTheme';
import { CellSidebarExtension } from '../components';
import { CellSidebarButton } from '../components/notebook/cell/sidebar/CellSidebarButton';
import { Notebook } from '../components/notebook/Notebook';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';

const PanelExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const extensions = useMemo(
    () => [new CellSidebarExtension({ factory: CellSidebarButton })],
    []
  );
  return (
    <ExampleJupyterReactTheme>
      {serviceManager && defaultKernel && (
        <Notebook
          id="notebook-panel-id"
          path="panel.ipynb"
          kernel={defaultKernel}
          serviceManager={serviceManager}
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          extensions={extensions}
          Toolbar={NotebookToolbar}
        />
      )}
    </ExampleJupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<PanelExample />);
