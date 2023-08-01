import { createRoot } from 'react-dom/client';
import { IOutput, INotebookContent } from '@jupyterlab/nbformat';
import Jupyter from '../jupyter/Jupyter';
import { useJupyter } from '../jupyter/JupyterContext';
import Cell from '../components/cell/Cell';
import Notebook from '../components/notebook/Notebook';
import Output from "../components/output/Output";
import FileBrowserLab from "../components/filebrowser/FileBrowserLab";
import Terminal from "../components/terminal/Terminal";
import NotebookToolbar from "./toolbars/NotebookToolbar";
import CellSidebarNew from "../components/notebook/cell/sidebar/CellSidebarNew";
// import CellSidebarDefault from '../components/notebook/cell/sidebar/CellSidebarDefault';
// import Console from "../components/console/Console";
// import { useDispatch } from "react-redux";
// import { Box, Button, ButtonGroup } from '@primer/react';
// import { Kernel } from '../jupyter/services/kernel/Kernel';
// import { selectCell, cellActions } from '../components/cell/CellState';
// import { notebookActions } from '../components/notebook/NotebookState';

import notebookExample from "./notebooks/NotebookExample1.ipynb.json";

import "./../../style/index.css";

const SOURCE_1 = '1+1'

// const NOTEBOOK_UID_1 = 'notebook-1-uid';
// const NOTEBOOK_UID_2 = 'notebook-2-uid';
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
/*
const CellPreview = () => {
  const cell = selectCell();
  return (
    <>
      <>source: {cell.source}</>
      <>kernel available: {String(cell.kernelAvailable)}</>
    </>
  )
}
*/
/*
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
*/
/*
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
*/
/*
const NotebookKernelChange = () => {
  const { kernelManager } = useJupyter();
  const changeKernel = () => {
    if (kernelManager) {
      const kernel = new Kernel({ kernelManager, kernelName: "pythonqsdf" });
      kernel.connection.then((kernelConnection) => {
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
        path="ping.ipynb"
        CellSidebar={CellSidebarDefault}
        uid={NOTEBOOK_UID_2}
      />
    </>
  );
}
*/
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
      nbformat={notebookExample as INotebookContent}
      CellSidebar={CellSidebarNew}
      Toolbar={NotebookToolbar}
      height='calc(100vh - 2.6rem)' // (Height - Toolbar Height).
      cellSidebarMargin={60}
      uid={NOTEBOOK_UID_3}
    />
    <hr />
    {/*
    <Console />
    <hr />
    <CellPreview />
    <CellToolbar />
    */}
    <Cell />
    <hr />
    <Outputs />
    <hr />
    {/*
    <NotebookToolbar />
    <Notebook
      path="ping.ipynb"
      // model={notebookExample as INotebookContent}
      CellSidebar={CellSidebarDefault}
      uid={NOTEBOOK_UID_1}
    />
    <hr />    
    <NotebookKernelChange />
    <hr />
    */}
    <FileBrowserLab />
    <hr />
    <Terminal />
  </Jupyter>
);
