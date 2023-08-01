import { createRoot } from 'react-dom/client';
import { useDispatch } from "react-redux";
import { INotebookContent } from '@jupyterlab/nbformat';
import { Box, Button } from '@primer/react';
import Jupyter from '../jupyter/Jupyter';
import Notebook from '../components/notebook/Notebook';
import CellSidebarDefault from "../components/notebook/cell/sidebar/CellSidebarDefault";
import NotebookToolbar from "./toolbars/NotebookToolbar";
import { createReduxEpicStore, createInjectableStore, InjectableStore } from '../redux/Store';
import { exampleReducer, selectFoo, exampleActions } from './redux/ExampleState';

import notebookExample from "./notebooks/NotebookExample1.ipynb.json";

import "./../../style/index.css";

const store = createReduxEpicStore();
const injectableStore = createInjectableStore(store);
injectableStore.inject('init', exampleReducer);

const FooDisplay = () => {
  const foo = selectFoo();
  return (
    <Box m={3}>
      Foo date: {foo ? foo.toISOString() : ""}
    </Box>
  )
}

const FooAction = () => {
  const dispatch = useDispatch();
  return (
    <Box m={3}>
      <Button onClick={() => dispatch(exampleActions.updateFoo(new Date()))}>
        Update the current date
      </Button>
    </Box>
  )
}

const NotebookRedux = (props: {injectableStore: InjectableStore}) => {
  const { injectableStore } = props;
  return (
    <>
      <Jupyter
        injectableStore={injectableStore}
        startDefaultKernel={true}
        terminals={false}
      >
        <FooDisplay/>
        <FooAction/>
        <Notebook
          nbformat={notebookExample as INotebookContent}
          CellSidebar={CellSidebarDefault}
          Toolbar={NotebookToolbar}
          height='calc(100vh - 2.6rem)' // (Height - Toolbar Height).
          cellSidebarMargin={120}
          uid="notebook-uid-1"
        />
      </Jupyter>
    </>
  )
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <NotebookRedux injectableStore={injectableStore} />
);
