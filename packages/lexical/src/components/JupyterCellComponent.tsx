/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { Cell } from '@datalayer/jupyter-react';

export const JupyterCellComponent = (props: any) => {
  return (
    <Cell
//      startDefaultKernel
      source="print('Hello Jupyter React')"
      autoStart
    />
  )
}

export default JupyterCellComponent;
