/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { useJupyter } from '../jupyter';
import { ExampleJupyterReactTheme } from './ExampleJupyterReactTheme';
import { CellSidebarButton } from '../components/notebook/cell/sidebar/CellSidebarButton';
import { Notebook } from '../components/notebook/Notebook';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import { CellSidebarExtension } from '../components';

const NOTEBOOK_ID = 'notebook-id';

const NotebookPathExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  return (
    <ExampleJupyterReactTheme>
      {serviceManager && defaultKernel && (
        <Notebook
          id={NOTEBOOK_ID}
          kernel={defaultKernel}
          serviceManager={serviceManager}
          path="ipywidgets.ipynb"
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          extensions={[
            new CellSidebarExtension({ factory: CellSidebarButton }),
          ]}
          Toolbar={NotebookToolbar}
        />
      )}
    </ExampleJupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookPathExample />);
