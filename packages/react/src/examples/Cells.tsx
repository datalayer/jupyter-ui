/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Box } from '@datalayer/primer-addons';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import Cell from '../components/cell/Cell';

const CellsExample = () => {
  return (
    <JupyterReactTheme>
      <Box as="h1">Cells Example</Box>
      <Cell source={'print("Hello from Cell 1")'} />
      <Cell source={'print("Hello from Cell 2")'} />
      <Cell source={'print("Hello from Cell 3")'} />
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<CellsExample />);
