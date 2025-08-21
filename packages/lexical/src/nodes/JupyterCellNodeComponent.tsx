/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { NodeKey } from 'lexical';
import { IOutput } from '@jupyterlab/nbformat';
import { Cell } from '@datalayer/jupyter-react';

type IJupyterCellNodeComponentProps = {
  nodeKey: NodeKey;
  code: string;
  outputs: IOutput[];
  autoStart: boolean;
};

export const JupyterCellNodeComponent = (
  props: IJupyterCellNodeComponentProps,
) => {
  const { code, outputs, autoStart } = props;
  return (
    <>
      <Cell source={code} outputs={outputs} autoStart={autoStart} />
    </>
  );
};

export default JupyterCellNodeComponent;
