/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { IOutput, INotebookContent } from '@jupyterlab/nbformat';
import { Box, Button, ButtonGroup, SegmentedControl } from '@primer/react';
import { DEFAULT_JUPYTER_SERVER_URL, DEFAULT_JUPYTER_SERVER_TOKEN } from '../jupyter';
import { Jupyter } from '../jupyter/Jupyter';
import { useJupyter } from '../jupyter/JupyterContext';
import { Kernel } from '../jupyter/kernel/Kernel';
import Cell from '../components/cell/Cell';
import { Notebook } from '../components/notebook/Notebook';
import Output from '../components/output/Output';
import FileBrowser from '../components/filebrowser/FileBrowser';
import FileManagerJupyterLab from '../components/filemanager/FileManagerJupyterLab';
import Terminal from '../components/terminal/Terminal';
import CellSidebarButton from '../components/notebook/cell/sidebar/CellSidebarButton';
import { CellSidebar } from '../components/notebook/cell/sidebar/CellSidebar';
import Console from '../components/console/Console';
import { useCellsStore } from '../components/cell/CellState';
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
  const cellsStore = useCellsStore();
  return (
    <>
      <>source: {cellsStore.getSource(props.id)}</>
      <>kernel available: {String(cellsStore.isKernelSessionAvailable(props.id))}</>
    </>
  );
};

const CellToolbar = (props: ICellToolProps) => {
  const {id} = props;
  const cellsStore = useCellsStore();
  return (
    <>
      <Box display="flex">
        <ButtonGroup>
          <Button
            variant="default"
            size="small"
            onClick={() => cellsStore.execute(id)}
          >
            Run the cell
          </Button>
          <Button
            variant="invisible"
            size="small"
            onClick={() => cellsStore.setOutputsCount(id, 0)}
          >
            Reset outputs count
          </Button>
        </ButtonGroup>
      </Box>
      <Box>Outputs count: {cellsStore.getOutputsCount(id)}</Box>
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
        showEditor
        autoRun={false}
        kernel={defaultKernel}
        code={SOURCE_1}
        outputs={SOURCE_1_OUTPUTS}
      />
      <Output
        showEditor
        autoRun={false}
        kernel={defaultKernel}
        code={SOURCE_2}
      />
      <Output
        showEditor
        autoRun
        kernel={defaultKernel}
        code={SOURCE_2}
      />
    </>
  );
};

const JuptyerContextExample = () => {
  const [index, setIndex] = useState(1);
  return (
    <>
      <Jupyter
        jupyterServerUrl={DEFAULT_JUPYTER_SERVER_URL}
        jupyterServerToken={DEFAULT_JUPYTER_SERVER_TOKEN}      
        serverless={index === 0}
        terminals
      >
        <SegmentedControl onChange={index => setIndex(index)} aria-label="jupyter-react-example">
          <SegmentedControl.Button defaultSelected={index === 0}>Serverless</SegmentedControl.Button>
          <SegmentedControl.Button defaultSelected={index === 1}>Server</SegmentedControl.Button>
        </SegmentedControl>
        <hr />
        <CellPreview id={cellId} />
        <CellToolbar id={cellId}/>
        <Cell id={cellId}/>
        <hr />
        <Notebook
          nbformat={notebook as INotebookContent}
          id={NOTEBOOK_ID_3}
          height="300px"
          cellSidebarMargin={60}
          CellSidebar={CellSidebarButton}
          Toolbar={NotebookToolbar}
        />
        <hr />
        <Console />
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
    </>
  );
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);
const cellId = 'my-cell-1'

root.render(<JuptyerContextExample/>);
