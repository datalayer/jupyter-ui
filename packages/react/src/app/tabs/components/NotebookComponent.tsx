/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import Notebook from '../../../components/notebook/Notebook';
import CellSidebarNew from './../../../components/notebook/cell/sidebar/CellSidebarButton';

import nbformat from './../../..//examples/notebooks/NotebookExample1.ipynb.json';

export const NotebookComponent = () => {
  return (
    <>
      <Notebook
        startDefaultKernel={true}
        nbformat={nbformat}
        id="notebook-id"
        cellSidebarMargin={60}
        height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
        CellSidebar={CellSidebarNew}
      />
    </>
  );
};

export default NotebookComponent;
