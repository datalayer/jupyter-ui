import { createRoot } from 'react-dom/client';
import { useDispatch } from "react-redux";
import { IOutput, INotebookContent } from '@jupyterlab/nbformat';
import { Box, Button, ButtonGroup } from '@primer/react';
import Jupyter from '../jupyter/Jupyter';
import { useJupyter } from '../jupyter/JupyterContext';
import { Kernel } from '../jupyter/services/kernel/Kernel';
import Cell from '../components/cell/Cell';
import Notebook from '../components/notebook/Notebook';
import Output from "../components/output/Output";
import FileBrowser from "../components/filebrowser/FileBrowser";
import FileManagerLab from "../components/filemanager/lab/FileManagerLab";
import Terminal from "../components/terminal/Terminal";
import CellSidebarNew from "../components/notebook/cell/sidebar/CellSidebarNew";
import CellSidebarDefault from '../components/notebook/cell/sidebar/CellSidebarDefault';
import Console from "../components/console/Console";
import { selectCell, cellActions } from '../components/cell/CellState';
import { notebookActions } from '../components/notebook/NotebookState';

import notebook from "./notebooks/NotebookExample1.ipynb.json";

const SOURCE_1 = '1+1'

const NOTEBOOK_UID_1 = 'notebook-1-uid';
const NOTEBOOK_UID_2 = 'notebook-2-uid';
const NOTEBOOK_UID_3 = 'notebook-3-uid';

const SOURCE_1_OUTPUTS: IOutput[] = [
  {
    "data": {
      "text/plain": [
        "2"
      ]
    },
    "execution_count": 1,
    "metadata": {},
    "output_type": "execute_result"
  }
];

const SOURCE_2 = `import ipywidgets as widgets
widgets.IntSlider(
    value=7,
    min=0,
    max=10,
    step=1
 )`

const CellPreview = () => {
  const cell = selectCell();
  return (
    <>
      <>source: {cell.source}</>
      <>kernel available: {String(cell.kernelAvailable)}</>
    </>
  )
}

const CellToolbar = () => {
  const cell = selectCell();
  const dispatch = useDispatch();
  return (
    <>
      <Box display="flex">
        <ButtonGroup>
          <Button
            variant="default"
            size="small"
            onClick={() => dispatch(cellActions.execute())}
          >
            Run the cell
          </Button>
          <Button
            variant="invisible"
            size="small"
            onClick={() => dispatch(cellActions.outputsCount(0))}
          >
            Reset outputs count
          </Button>
        </ButtonGroup>
      </Box>
      <Box>
        Outputs count: {cell.outputsCount}
      </Box>
    </>
  );
}

const NotebookToolbar = () => {
  const dispatch = useDispatch();
  return (
    <Box display="flex">
      <ButtonGroup>
        <Button
          variant="default"
          size="small"
          onClick={() => dispatch(notebookActions.save.started({ uid: NOTEBOOK_UID_1, date: new Date() }))}
        >
          Save the notebook
        </Button>
        <Button
          variant="default"
          size="small"
          onClick={() => dispatch(notebookActions.runAll.started(NOTEBOOK_UID_1))}
        >
          Run all
        </Button>
      </ButtonGroup>
    </Box>
  );
}

const NotebookKernelChange = () => {
  const { kernelManager, serverSettings } = useJupyter();
  const dispatch = useDispatch();
  const changeKernel = () => {
    if (kernelManager) {
      const kernel = new Kernel({
        kernelManager,
        kernelName: "defaultKernel",
        kernelType: "notebook",
        kernelSpecName: "python",
        serverSettings,
      });
      kernel.ready.then(() => {
        dispatch(notebookActions.changeKernel({ uid: NOTEBOOK_UID_2, kernel }));
        alert('The kernel is changed.')
      });      
    }
  }
  return (
    <>
      <Box display="flex">
        <ButtonGroup>
          <Button
            variant="default"
            size="small"
            onClick={changeKernel}
          >
            Switch Kernel
          </Button>
        </ButtonGroup>
      </Box>
      <Notebook
        path="test.ipynb"
        CellSidebar={CellSidebarDefault}
        uid={NOTEBOOK_UID_2}
      />
    </>
  );
}

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
  )
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <Jupyter lite={false} terminals={true}>
    <Notebook
      nbformat={notebook as INotebookContent}
      uid={NOTEBOOK_UID_3}
      height='calc(100vh - 2.6rem)' // (Height - Toolbar Height).
      cellSidebarMargin={60}
      CellSidebar={CellSidebarNew}
      Toolbar={NotebookToolbar}
    />
    <hr/>
    <Console />
    <hr/>
    <CellPreview />
    <CellToolbar />
    <Cell />
    <hr/>
    <Outputs />
    <hr/>
    <NotebookToolbar />
    <Notebook
      path="ipywidgets.ipynb"
      CellSidebar={CellSidebarDefault}
      uid={NOTEBOOK_UID_1}
    />
    <hr/>    
    <NotebookKernelChange />
    <hr/>
    <FileManagerLab />
    <hr/>
    <FileBrowser />
    <hr/>
    <Terminal />
  </Jupyter>
);
