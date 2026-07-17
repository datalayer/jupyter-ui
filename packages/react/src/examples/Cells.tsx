/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Box, Heading } from '@primer/react';
import { ExampleJupyterReactTheme } from './ExampleJupyterReactTheme';
import { useJupyter } from '../jupyter/JupyterUse';
import { Cell } from '../components/cell/Cell';

const CellsExample = () => {
  const { defaultKernel } = useJupyter({ startDefaultKernel: true });
  return (
    <ExampleJupyterReactTheme>
      <Box sx={{ px: 3, py: 2, bg: 'canvas.default' }}>
        <Heading
          as="h1"
          sx={{ m: 0, fontSize: 4, fontWeight: 'bold' }}
        >
          Cells
        </Heading>
      </Box>
      {defaultKernel && (
        <>
          <Cell source={'print("Hello from Cell 1")'} kernel={defaultKernel} />
          <Cell source={'print("Hello from Cell 2")'} kernel={defaultKernel} />
          <Cell source={'print("Hello from Cell 3")'} kernel={defaultKernel} />
        </>
      )}
    </ExampleJupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<CellsExample />);
