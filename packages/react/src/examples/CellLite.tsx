/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Box } from '@primer/react';
import { Jupyter } from '../jupyter/Jupyter';
import Cell from '../components/cell/Cell';

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <Jupyter startDefaultKernel lite>
    <Box as="h1">A Jupyter Cell with a Lite Kernel</Box>
    <Cell
      source={`import sys
print(f"👋 Hello Jupyter UI Lite - Platform: {sys.platform} - IPython: {get_ipython()}")`}
    />
  </Jupyter>
);
