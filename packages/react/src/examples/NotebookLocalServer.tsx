/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { Text } from '@primer/react';
import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { CellSidebarExtension } from '../components';
import { CellSidebarButton } from '../components/notebook/cell/sidebar/CellSidebarButton';
import { Notebook2 } from '../components/notebook/Notebook2';
import { useJupyter } from '../jupyter';
import { JupyterReactTheme } from '../theme';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';

const NotebookJupyterExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
    jupyterServerUrl: 'https://oss.datalayer.tech/api/jupyter-server',
    jupyterServerToken:
      '60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6',
  });
  const extensions = useMemo(
    () => [new CellSidebarExtension({ factory: CellSidebarButton })],
    []
  );
  return (
    <JupyterReactTheme>
      {serviceManager && defaultKernel && (
        <Notebook2
          id="notebook-jupyter-react-theme-id"
          kernel={defaultKernel}
          serviceManager={serviceManager}
          path="ipywidgets.ipynb"
          height="calc(100vh - 250px)" // (Height - Toolbar Height).
          extensions={extensions}
          Toolbar={NotebookToolbar}
        />
      )}
    </JupyterReactTheme>
  );
};

const NotebookJupyterReactThemeExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
    jupyterServerUrl: 'http://localhost:8686/api/jupyter-server',
    jupyterServerToken:
      '60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6',
  });
  const extensions = useMemo(
    () => [new CellSidebarExtension({ factory: CellSidebarButton })],
    []
  );
  return (
    <JupyterReactTheme>
      {serviceManager && defaultKernel && (
        <Notebook2
          id="notebook-jupyter-react-theme-id"
          kernel={defaultKernel}
          serviceManager={serviceManager}
          path="ipywidgets.ipynb"
          height="calc(100vh - 250px)" // (Height - Toolbar Height).
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

root.render(
  <>
    <Text as="h1">Local Jupyter Server (with a Jupyter Context)</Text>
    <NotebookJupyterExample />
    <Text as="h1">Local Jupyter Server (with a Jupyter React Theme)</Text>
    <NotebookJupyterReactThemeExample />
  </>
);
