/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { Box, Button, Label } from '@primer/react';
import { Cell, KernelIndicator, useKernelsStore, useCellsStore, Kernel } from '@datalayer/jupyter-react';

const CELL_ID = 'cell-example-1';

const DEFAULT_SOURCE = `from IPython.display import display

for i in range(10):
    display('I am a long string which is repeatedly added to the dom in separated divs: %d' % i)`;

type ICellExampleProps = {
  kernel: Kernel;
}

export const CellExample = (props: ICellExampleProps) => {
  const { kernel } = props;
  const cellsStore = useCellsStore();
  const kernelsStore = useKernelsStore();
  return (
    <>
      <Box as="h1">A Jupyter Cell</Box>
      <Box>
        Source: {cellsStore.getSource(CELL_ID)}
      </Box>
      <Box>
        Outputs Count: {cellsStore.getOutputsCount(CELL_ID)}
      </Box>
      <Box>
        Kernel State: <Label>{kernelsStore.getExecutionState(kernel.id)}</Label>
      </Box>
      <Box>
        Kernel Phase: <Label>{kernelsStore.getExecutionPhase(kernel.id)}</Label>
      </Box>
      <Box display="flex">
        <Box>
          Kernel Indicator:
        </Box>
        <Box ml={3}>
          <KernelIndicator kernel={kernel.connection}/>
        </Box>
      </Box>
      <Box>
        <Button onClick={() => cellsStore.execute(CELL_ID)}>Run cell</Button>
      </Box>
      <Cell source={DEFAULT_SOURCE} id={CELL_ID}/>
    </>
  )
}

export default CellExample;
