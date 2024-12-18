/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { FileBrowser, useJupyter, JupyterReactTheme } from '@datalayer/jupyter-react';
import Layers from './../layout/Layers';

import './../App.css';

const FileBrowserExample = () => {
  const { serviceManager } = useJupyter();
  return (
    serviceManager
      ? <FileBrowser serviceManager={serviceManager}/>
      : <></>
  )
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <JupyterReactTheme>
    <Layers/>
    <FileBrowserExample />
  </JupyterReactTheme>
);
