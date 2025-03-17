/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { NodeKey } from "lexical";
import { IOutput } from '@jupyterlab/nbformat';
import { JupyterCellComponent } from "./../components/JupyterCellComponent";

type IJupyterCellNodeComponentProps = {
  nodeKey: NodeKey;
  code: string;
  outputs: IOutput[];
  loading: string;
  autoStart: boolean;
  data: any;
}

export const JupyterCellNodeComponent = (props: IJupyterCellNodeComponentProps) => {
  const { code, outputs, loading, autoStart } = props;
  return (
    <>
      <JupyterCellComponent
        code={code}
        outputs={outputs}
        loading={loading}
        autoStart={autoStart}
      />
    </>
  );
}

export default JupyterCellNodeComponent;
