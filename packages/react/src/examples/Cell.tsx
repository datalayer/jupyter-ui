/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Button, Label } from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import { PlayIcon } from '@primer/octicons-react';
import { JupyterReactTheme } from '../theme';
import { useJupyter } from '../jupyter/JupyterUse';
import { useKernelsStore } from '../jupyter/kernel/KernelState';
import { KernelIndicator } from '../components/kernel/KernelIndicator';
import { Cell } from '../components/cell/Cell';
import { useCellsStore } from '../components/cell/CellState';

const CELL_ID = 'cell-example-1';

const DEFAULT_SOURCE = `from IPython.display import display

for i in range(10):
    display('I am a long string which is repeatedly added to the dom in separated divs: %d' % i)`;

const CellExample = () => {
  const { defaultKernel } = useJupyter({ startDefaultKernel: true });
  const cellsStore = useCellsStore();
  const kernelsStore = useKernelsStore();
  return (
    <JupyterReactTheme>
      <Box as="h1">Cell</Box>
      <Box as="pre">Source: {cellsStore.getSource(CELL_ID)}</Box>
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
      <Box>
        <KernelIndicator
          kernel={defaultKernel?.connection}
          label="Kernel Indicator"
        />
      </Box>
      <Box>
        <Button
          leadingVisual={() => <PlayIcon />}
          onClick={() => cellsStore.execute(CELL_ID)}
        >
          Run cell
        </Button>
      </Box>
      {defaultKernel && (
        <Cell id={CELL_ID} source={DEFAULT_SOURCE} kernel={defaultKernel} />
      )}
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<CellExample />);
