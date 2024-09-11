/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Box } from '@primer/react';
import JupyterLabTheme from '../jupyter/lab/JupyterLabTheme';
import Console from '../components/console/Console';

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <JupyterLabTheme>
    <Box as="h1">A Jupyter Console</Box>
    <Console code={"print('👋 Hello Jupyter Console')"} />
  </JupyterLabTheme>
);
