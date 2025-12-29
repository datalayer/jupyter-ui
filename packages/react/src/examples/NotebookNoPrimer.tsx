/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { useJupyter } from '../jupyter';
import { JupyterLabCss } from '../theme';
import { CellSidebarExtension } from '../components';
import { CellSidebarButton } from '../components/notebook/cell/sidebar/CellSidebarButton';
import { Notebook2 } from '../components/notebook/Notebook2';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';

const NOTEBOOK_ID = 'notebook-id';

const NotebookNoPrimerExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  return (
    <>
      <JupyterLabCss colormode="dark" />
      {serviceManager && defaultKernel && (
        <Notebook2
          id={NOTEBOOK_ID}
          kernel={defaultKernel}
          serviceManager={serviceManager}
          path="ipywidgets.ipynb"
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          extensions={[new CellSidebarExtension({ factory: CellSidebarButton })]}
          Toolbar={NotebookToolbar}
        />
      )}
    </>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookNoPrimerExample />);
