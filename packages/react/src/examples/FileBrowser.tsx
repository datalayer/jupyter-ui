/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { useJupyter } from './../jupyter/JupyterUse';
import { FileBrowser } from '../components/filebrowser/FileBrowser';

const FileBrowserExample = () => {
  const { serviceManager } = useJupyter();
  return serviceManager ? (
    <JupyterReactTheme>
      <h1>File Browser</h1>
      <FileBrowser serviceManager={serviceManager} />
    </JupyterReactTheme>
  ) : (
    <></>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<FileBrowserExample />);
