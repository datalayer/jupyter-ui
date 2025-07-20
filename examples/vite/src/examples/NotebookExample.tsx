/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { Box } from '@primer/react';
import { Notebook2, Kernel, NotebookToolbar, CellSidebarExtension, CellSidebarButton } from '@datalayer/jupyter-react';
import { ServiceManager } from '@jupyterlab/services';

const NOTEBOOK_ID = 'notebook-example-1';

type INotebookExampleProps = {
  kernel: Kernel;
  serviceManager: ServiceManager.IManager;
}

export const NotebookExample = (props: INotebookExampleProps) => {
  const { kernel, serviceManager } = props;
  return (
    <>
      <Box as="h1">A Jupyter Notebook</Box>
      <Notebook2
        path="ipywidgets.ipynb"
        id={NOTEBOOK_ID}
        serviceManager={serviceManager}
        kernelId={kernel.id}
        extensions={[new CellSidebarExtension({ factory: CellSidebarButton })]}
        Toolbar={NotebookToolbar}
      />
    </>
  )
}

export default NotebookExample;
