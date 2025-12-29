/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { CellSidebarExtension } from '../components';
import { useJupyter } from '../jupyter';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { CellSidebarButton } from '../components/notebook/cell/sidebar/CellSidebarButton';
import { Notebook } from '../components/notebook/Notebook';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';

const NOTEBOOK_ID = 'notebook-id';

const NotebookURLExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  return (
    <JupyterReactTheme>
      {serviceManager && defaultKernel && (
        <Notebook
          id={NOTEBOOK_ID}
          kernel={defaultKernel}
          serviceManager={serviceManager}
          url="https://raw.githubusercontent.com/datalayer/jupyter-ui/main/packages/react/src/examples/notebooks/IPyWidgetsExampleWithState.ipynb.json"
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          extensions={[
            new CellSidebarExtension({ factory: CellSidebarButton }),
          ]}
          Toolbar={NotebookToolbar}
        />
      )}
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookURLExample />);
