/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { useDispatch } from 'react-redux';
import { INotebookContent } from '@jupyterlab/nbformat';
import { Box, Button } from '@primer/react';
import Jupyter from '../jupyter/Jupyter';
import Notebook from '../components/notebook/Notebook';
import CellSidebar from '../components/notebook/cell/sidebar/CellSidebar';
import NotebookToolbar from './toolbars/NotebookToolbar';
import {
  createReduxEpicStore,
  createInjectableStore,
  InjectableStore,
} from '../state/redux/Store';
import {
  exampleReducer,
  selectFoo,
  exampleActions,
} from './state/ExampleReduxState';

import nbformat from './notebooks/NotebookExample1.ipynb.json';

const store = createReduxEpicStore();
const injectableStore = createInjectableStore(store);
injectableStore.inject('init', exampleReducer);

const FooDisplay = () => {
  const foo = selectFoo();
  return <Box m={3}>Foo date: {foo ? foo.toISOString() : ''}</Box>;
};

const FooAction = () => {
  const dispatch = useDispatch();
  return (
    <Box m={3}>
      <Button onClick={() => dispatch(exampleActions.updateFoo(new Date()))}>
        Update the current date
      </Button>
    </Box>
  );
};

const NotebookInjectableReduxStore = (props: {
  injectableStore: InjectableStore;
}) => {
  const { injectableStore } = props;
  return (
    <>
      <Jupyter injectableStore={injectableStore}>
        <FooDisplay />
        <FooAction />
        <Notebook
          nbformat={nbformat as INotebookContent}
          uid="notebook-uid-1"
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          cellSidebarMargin={120}
          CellSidebar={CellSidebar}
          Toolbar={NotebookToolbar}
        />
      </Jupyter>
    </>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookInjectableReduxStore injectableStore={injectableStore} />);
