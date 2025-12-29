/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { CellSidebarExtension } from '../../../components';
import { Notebook2 } from '../../../components/notebook/Notebook2';
import { useJupyter } from '../../../jupyter';
import { CellSidebarButton } from './../../../components/notebook/cell/sidebar/CellSidebarButton';

import NBFORMAT from './../../..//examples/notebooks/NotebookExample1.ipynb.json';

export const NotebookComponent = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const extensions = useMemo(
    () => [new CellSidebarExtension({ factory: CellSidebarButton })],
    []
  );
  return (
    <>
      {serviceManager && defaultKernel && (
        <Notebook2
          kernel={defaultKernel}
          serviceManager={serviceManager}
          nbformat={NBFORMAT}
          id="notebook-id"
          cellSidebarMargin={60}
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          extensions={extensions}
        />
      )}
    </>
  );
};

export default NotebookComponent;
