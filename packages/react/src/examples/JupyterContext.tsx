/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent, IOutput } from '@jupyterlab/nbformat';
import { Button, ButtonGroup, SegmentedControl } from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import { useJupyter } from '../jupyter';
import { Kernel } from '../jupyter/kernel/Kernel';
// import {
//   DEFAULT_JUPYTER_SERVER_TOKEN,
//   DEFAULT_JUPYTER_SERVER_URL,
// } from '../jupyter';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { Cell } from '../components/cell/Cell';
import { useCellsStore } from '../components/cell/CellState';
import { Console } from '../components/console/Console';
import { FileBrowser } from '../components/filebrowser/FileBrowser';
import { FileManagerJupyterLab } from '../components/filemanager/FileManagerJupyterLab';
import { CellSidebarButton } from '../components/notebook/cell/sidebar/CellSidebarButton';
import { Notebook } from '../components/notebook/Notebook';
import { useNotebookStore } from '../components/notebook/NotebookState';
import { Output } from '../components/output/Output';
import { Terminal } from '../components/terminal/Terminal';
import { CellSidebarExtension } from '../components';

import NBFORMAT from './notebooks/NotebookExample1.ipynb.json';

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
      <>
        kernel available:{' '}
        {String(cellsStore.isKernelSessionAvailable(props.id))}
      </>
    </>
  );
};

const CellToolbar = (props: ICellToolProps) => {
  const { id } = props;
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
          onClick={() => {
            /*
            notebookStore.save({
              id: NOTEBOOK_ID_1,
              date: new Date(),
            })
            */
          }}
        >
          Save the notebook
        </Button>
        <Button
          variant="default"
          size="small"
          onClick={() => notebookStore.runAll(NOTEBOOK_ID_1)}
        >
          Run all
        </Button>
      </ButtonGroup>
    </Box>
  );
};

const NotebookKernelChange = () => {
  const { kernelManager, serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const notebookStore = useNotebookStore();
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
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
      {serviceManager && defaultKernel && (
        <Notebook
          path="test.ipynb"
          kernel={defaultKernel}
          serviceManager={serviceManager}
          extensions={extensions}
          id={NOTEBOOK_ID_2}
        />
      )}
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
      <Output showEditor autoRun kernel={defaultKernel} code={SOURCE_2} />
    </>
  );
};

const JupyterContextExample = () => {
  const [index, setIndex] = useState(1);
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const extensionsButton = useMemo(
    () => [new CellSidebarExtension({ factory: CellSidebarButton })],
    []
  );
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  return (
    <>
      <JupyterReactTheme
      //        jupyterServerUrl={DEFAULT_JUPYTER_SERVER_URL}
      //        jupyterServerToken={DEFAULT_JUPYTER_SERVER_TOKEN}
      //        serverless={index === 0}
      //        terminals
      //        startDefaultKernel
      >
        <SegmentedControl
          onChange={index => setIndex(index)}
          aria-label="jupyter-react-example"
        >
          <SegmentedControl.Button defaultSelected={index === 0}>
            Serverless
          </SegmentedControl.Button>
          <SegmentedControl.Button defaultSelected={index === 1}>
            Server
          </SegmentedControl.Button>
        </SegmentedControl>
        <hr />
        <CellPreview id={cellId} />
        <CellToolbar id={cellId} />
        {defaultKernel && <Cell id={cellId} kernel={defaultKernel} />}
        <hr />
        {serviceManager && defaultKernel && (
          <Notebook
            nbformat={NBFORMAT as INotebookContent}
            id={NOTEBOOK_ID_3}
            kernel={defaultKernel}
            serviceManager={serviceManager}
            height="300px"
            extensions={extensionsButton}
            Toolbar={NotebookToolbar}
          />
        )}
        <hr />
        <Console />
        <hr />
        <Outputs />
        <hr />
        <NotebookToolbar />
        {serviceManager && defaultKernel && (
          <Notebook
            path="ipywidgets.ipynb"
            kernel={defaultKernel}
            serviceManager={serviceManager}
            extensions={extensions}
            id={NOTEBOOK_ID_1}
          />
        )}
        <hr />
        <NotebookKernelChange />
        <hr />
        <FileManagerJupyterLab />
        <hr />
        {serviceManager && <FileBrowser serviceManager={serviceManager} />}
        <hr />
        <Terminal />
      </JupyterReactTheme>
    </>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);
const cellId = 'my-cell-1';

root.render(<JupyterContextExample />);
