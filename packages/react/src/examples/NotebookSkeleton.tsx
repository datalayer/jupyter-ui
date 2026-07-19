/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
// import { ContentLoader } from '@datalayer/primer-addons';
import { useJupyter } from '../jupyter';
import { ExampleJupyterReactTheme } from './ExampleJupyterReactTheme';
import { CellSidebarExtension } from '../components';
import { CellSidebarButton } from '../components/notebook/cell/sidebar/CellSidebarButton';
import { Notebook } from '../components/notebook/Notebook';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';

const NOTEBOOK_ID = 'notebook-id';

const NotebookSkeletonExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  return (
    <ExampleJupyterReactTheme
    // skeleton={<ContentLoader count={3} />}
    >
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

root.render(<NotebookSkeletonExample />);
