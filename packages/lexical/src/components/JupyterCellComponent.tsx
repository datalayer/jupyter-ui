/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { IOutput } from '@jupyterlab/nbformat';
import { Cell } from '@datalayer/jupyter-react';

type IJupyterCellComponentProps = {
  code: string;
  outputs: IOutput[];
  loading: string;
  autoStart: boolean;
}

export const JupyterCellComponent = (props: IJupyterCellComponentProps) => {
  const { autoStart, code, outputs } = props;
  return (
    <Cell
//      startDefaultKernel
      source={code}      
      autoStart={autoStart}
      outputs={outputs}
    />
  )
}

export default JupyterCellComponent;
