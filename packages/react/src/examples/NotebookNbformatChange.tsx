/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { Button, ButtonGroup } from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import { useJupyter } from '../jupyter';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { CellSidebarExtension } from '../components';
import { Notebook } from '../components/notebook/Notebook';
import { useNotebookStore } from '../components/notebook/NotebookState';

import NBFORMAT_1 from './notebooks/NotebookExample1.ipynb.json';

import NBFORMAT_2 from './notebooks/NotebookExample2.ipynb.json';

const NOTEBOOK_ID = 'notebook-model-change-id';

const NotebookNbformatChangeExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const notebookStore = useNotebookStore();
  const [nbformat, setNbformat] = useState(NBFORMAT_1);
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  const changeNbformat = () => {
    console.log(
      'Notebook Nbformat from store',
      notebookStore.notebooks
        .get(NOTEBOOK_ID)
        ?.model?.toJSON() as INotebookContent
    );
    if (nbformat === NBFORMAT_1) {
      setNbformat(NBFORMAT_2);
    } else {
      setNbformat(NBFORMAT_1);
    }
  };
  return (
    <JupyterReactTheme>
      <Box display="flex">
        <ButtonGroup>
          <Button variant="default" size="small" onClick={changeNbformat}>
            Change Nbformat
          </Button>
        </ButtonGroup>
      </Box>
      {serviceManager && defaultKernel && (
        <Notebook
          id={NOTEBOOK_ID}
          kernel={defaultKernel}
          serviceManager={serviceManager}
          nbformat={nbformat}
          height="700px"
          extensions={extensions}
        />
      )}
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookNbformatChangeExample />);
