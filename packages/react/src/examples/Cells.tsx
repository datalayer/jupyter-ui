/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Box } from '@primer/react';
import JupyterLabTheme from '../jupyter/lab/JupyterLabTheme';
import Cell from '../components/cell/Cell';

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <JupyterLabTheme>
    <Box as="h1">Jupyter Cells wrapped in a single Jupyter Context</Box>
    <Cell id="cell-1" source="x=1" />
    <Cell id="cell-2" source="print(x)" />
    <Cell id="cell-3" source={`import random

r = random.randint(0,9)`}
    />
    <Cell source="print(f'Random integer: {r}')" />
  </JupyterLabTheme>
);
