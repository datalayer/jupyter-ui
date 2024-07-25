/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { IOutput, INotebookContent } from '@jupyterlab/nbformat';
import { Box, Button, ButtonGroup } from '@primer/react';
import Jupyter from '../jupyter/Jupyter';
import { useJupyter } from '../jupyter/JupyterContext';
import { Kernel } from '../jupyter/kernel/Kernel';
import Cell from '../components/cell/Cell';
import Notebook from '../components/notebook/Notebook';
import Output from '../components/output/Output';
import FileBrowser from '../components/filebrowser/FileBrowser';
import FileManagerJupyterLab from '../components/filemanager/FileManagerJupyterLab';
import Terminal from '../components/terminal/Terminal';
import CellSidebarNew from '../components/notebook/cell/sidebar/CellSidebarButton';
import CellSidebar from '../components/notebook/cell/sidebar/CellSidebar';
import Console from '../components/console/Console';
import { useCellStore } from '../components/cell/CellState';
import useNotebookStore from '../components/notebook/NotebookState';

import notebook from './notebooks/NotebookExample1.ipynb.json';

const SOURCE_1 = '1+1';

const NOTEBOOK_ID_1 = 'notebook-1-id';
const NOTEBOOK_ID_2 = 'notebook-2-id';
const NOTEBOOK_ID_3 = 'notebook-3-id';

const SOURCE_1_OUTPUTS: IOutput[] = [
  {
    data: {
      'text/plain': ['2'],
    },
    execution_count: 1,
    metadata: {},
    output_type: 'execute_result',
  },
];

const SOURCE_2 = `import ipywidgets as widgets
widgets.IntSlider(
    value=7,
    min=0,
    max=10,
    step=1
 )`;

interface ICellToolProps {
  id: string; // Cell id
}

const CellPreview = (props: ICellToolProps) => {
  const cellStore = useCellStore();
  return (
    <>
      <>source: {cellStore.getSource(props.id)}</>
      <>kernel available: {String(cellStore.kernelAvailable)}</>
    </>
  );
};

const CellToolbar = (props: ICellToolProps) => {
  const {id} = props;
  const cellStore = useCellStore();
  return (
    <>
      <Box display="flex">
        <ButtonGroup>
          <Button
            variant="default"
            size="small"
            onClick={() => cellStore.execute(id)}
          >
            Run the cell
          </Button>
          <Button
            variant="invisible"
            size="small"
            onClick={() => cellStore.setOutputsCount(id, 0)}
          >
            Reset outputs count
          </Button>
        </ButtonGroup>
      </Box>
      <Box>Outputs count: {cellStore.getOutputsCount(id)}</Box>
    </>
  );
};

const NotebookToolbar = () => {
  const notebookStore = useNotebookStore();
  return (
    <Box display="flex">
      <ButtonGroup>
        <Button
          variant="default"
          size="small"
          onClick={() =>
            notebookStore.save({
              id: NOTEBOOK_ID_1,
              date: new Date(),
            })
          }
        >
          Save the notebook
        </Button>
        <Button
          variant="default"
          size="small"
          onClick={() =>
            notebookStore.runAll(NOTEBOOK_ID_1)
          }
        >
          Run all
        </Button>
      </ButtonGroup>
    </Box>
  );
};

const NotebookKernelChange = () => {
  const { kernelManager, serviceManager } = useJupyter();
  const notebookStore = useNotebookStore();
  const changeKernel = () => {
    if (serviceManager && kernelManager) {
      const kernel = new Kernel({
        kernelManager,
        kernelName: 'defaultKernel',
        kernelSpecName: 'python',
        kernelType: 'notebook',
        kernelspecsManager: serviceManager.kernelspecs,
        sessionManager: serviceManager.sessions,
      });
      kernel.ready.then(() => {
        notebookStore.changeKernel({ id: NOTEBOOK_ID_2, kernel });
        alert('Kernel is changed.');
      });
    }
  };
  return (
    <>
      <Box display="flex">
        <ButtonGroup>
          <Button variant="default" size="small" onClick={changeKernel}>
            Switch Kernel
          </Button>
        </ButtonGroup>
      </Box>
      <Notebook
        path="test.ipynb"
        CellSidebar={CellSidebar}
        id={NOTEBOOK_ID_2}
      />
    </>
  );
};

const Outputs = () => {
  const { defaultKernel } = useJupyter();
  return (
    <>
      <Output
        showEditor={true}
        autoRun={false}
        kernel={defaultKernel}
        code={SOURCE_1}
        outputs={SOURCE_1_OUTPUTS}
      />
      <Output
        showEditor={true}
        autoRun={false}
        kernel={defaultKernel}
        code={SOURCE_2}
      />
      <Output
        showEditor={true}
        autoRun={true}
        kernel={defaultKernel}
        code={SOURCE_2}
      />
    </>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);
const cellId = 'my-cell-1'

root.render(
  <Jupyter terminals={true}>
    <Notebook
      nbformat={notebook as INotebookContent}
      id={NOTEBOOK_ID_3}
      height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
      cellSidebarMargin={60}
      CellSidebar={CellSidebarNew}
      Toolbar={NotebookToolbar}
    />
    <hr />
    <Console />
    <hr />
    <CellPreview id={cellId} />
    <CellToolbar id={cellId}/>
    <Cell id={cellId}/>
    <hr />
    <Outputs />
    <hr />
    <NotebookToolbar />
    <Notebook
      path="ipywidgets.ipynb"
      CellSidebar={CellSidebar}
      id={NOTEBOOK_ID_1}
    />
    <hr />
    <NotebookKernelChange />
    <hr />
    <FileManagerJupyterLab />
    <hr />
    <FileBrowser />
    <hr />
    <Terminal />
  </Jupyter>
);
