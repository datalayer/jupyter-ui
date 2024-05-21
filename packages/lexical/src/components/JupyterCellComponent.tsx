/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { Cell } from '@datalayer/jupyter-react';

export const JupyterCellComponent = (props: any) => {
  return (
    <Cell 
      source="print('hello')"
      autoStart={true}
    />
  )
}

export default JupyterCellComponent;
