/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { JupyterReactTheme } from '../themes/JupyterReactTheme';
import FileBrowser from '../components/filebrowser/FileBrowser';

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <JupyterReactTheme>
    <FileBrowser />
  </JupyterReactTheme>
);
