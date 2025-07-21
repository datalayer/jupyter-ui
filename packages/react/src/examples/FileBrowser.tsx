/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { useJupyter } from './../jupyter/JupyterContext';
import FileBrowser from '../components/filebrowser/FileBrowser';

const FileBrowserExample = () => {
  const { serviceManager } = useJupyter();
  return (
    serviceManager ?
      <>
        <h1>Jupyter React - File Browser Example</h1>
        <FileBrowser serviceManager={serviceManager}/>
      </>
    :
      <></>
  )
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <JupyterReactTheme>
    <FileBrowserExample />
  </JupyterReactTheme>
);
