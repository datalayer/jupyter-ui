/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Box, Button, Label } from '@primer/react';
import { CodeCell } from '@jupyterlab/cells';
import { JupyterReactTheme } from '../theme';
import { useJupyter } from '../jupyter/JupyterContext';
import { Cell } from '../components/cell/Cell';
import { KernelIndicator } from '../components/kernel/Kernelndicator';
import { useKernelsStore } from '../jupyter/kernel/KernelState';
import { useCellsStore } from '../components/cell/CellState';

const CELL_ID = 'cell-example-1';

const DEFAULT_SOURCE = `from IPython.display import display

for i in range(10):
    display('I am a long string which is repeatedly added to the dom in separated divs: %d' % i)`;

const CellExample = () => {
  const { defaultKernel } = useJupyter();
  const cellsStore = useCellsStore();
  const kernelsStore = useKernelsStore();
  console.log(
    'Jupyter Cell Outputs',
    (
      cellsStore.getAdapter(CELL_ID)?.cell as CodeCell
    )?.outputArea.model.toJSON()
  );
  return (
    <JupyterReactTheme>
      <Box as="h1">A Jupyter Cell</Box>
      <Box>Source: {cellsStore.getSource(CELL_ID)}</Box>
      <Box>Outputs Count: {cellsStore.getOutputsCount(CELL_ID)}</Box>
      <Box>
        Kernel State:{' '}
        <Label>
          {defaultKernel && kernelsStore.getExecutionState(defaultKernel.id)}
        </Label>
      </Box>
      <Box>
        Kernel Phase:{' '}
        <Label>
          {defaultKernel && kernelsStore.getExecutionPhase(defaultKernel.id)}
        </Label>
      </Box>
      <Box display="flex">
        <Box>Kernel Indicator:</Box>
        <Box ml={3}>
          <KernelIndicator kernel={defaultKernel && defaultKernel.connection} />
        </Box>
      </Box>
      <Box>
        <Button onClick={() => cellsStore.execute(CELL_ID)}>Run cell</Button>
      </Box>
      <Cell source={DEFAULT_SOURCE} id={CELL_ID} kernel={defaultKernel} />
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<CellExample />);
