/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { ExampleJupyterReactTheme } from './ExampleJupyterReactTheme';
import { useJupyter } from './../jupyter/JupyterUse';
import { FileBrowser } from '../components/filebrowser/FileBrowser';

const FileBrowserExample = () => {
  const { serviceManager } = useJupyter();
  return serviceManager ? (
    <ExampleJupyterReactTheme>
      <h1>File Browser</h1>
      <FileBrowser serviceManager={serviceManager} />
    </ExampleJupyterReactTheme>
  ) : (
    <></>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<FileBrowserExample />);
