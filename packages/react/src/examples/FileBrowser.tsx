/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import JupyterLabTheme from '../jupyter/lab/JupyterLabTheme';
import FileBrowser from '../components/filebrowser/FileBrowser';

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <JupyterLabTheme>
    <FileBrowser />
  </JupyterLabTheme>
);
