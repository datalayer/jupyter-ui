/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { NodeKey } from "lexical";
import { JupyterCellComponent } from "./../components/JupyterCellComponent";

type Props = {
  nodeKey: NodeKey;
  data: any;
}

export const JupyterCellNodeComponent = ({ nodeKey, data }: Props) => {
  return (
    <>
      <JupyterCellComponent/>
    </>
  );
}

export default JupyterCellNodeComponent;
