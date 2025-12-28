/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { CellSidebarExtension } from '../../../components';
import Notebook from '../../../components/notebook/Notebook';
import CellSidebarNew from './../../../components/notebook/cell/sidebar/CellSidebarButton';

import NBFORMAT from './../../..//examples/notebooks/NotebookExample1.ipynb.json';

export const NotebookComponent = () => {
  return (
    <>
      <Notebook
        startDefaultKernel
        nbformat={NBFORMAT}
        id="notebook-id"
        cellSidebarMargin={60}
        height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
        extensions={[new CellSidebarExtension({ factory: CellSidebarNew })]}
      />
    </>
  );
};

export default NotebookComponent;
