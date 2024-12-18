/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { FileBrowser } from '@datalayer/jupyter-react';
import { RenderJupyterProps } from "../../elements/Element";

const JupyterFileBrowser = ({attributes, children, element}: RenderJupyterProps) => {
  return (
    <div {...attributes}>
      <FileBrowser/>
      {children}
    </div>
  )   
}

export default JupyterFileBrowser;
