/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Box, Button } from '@primer/react';
import { CodeCell } from '@jupyterlab/cells';
import { useJupyterStore } from './../state';
import Jupyter from '../jupyter/Jupyter';
import Cell from '../components/cell/Cell';

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

const DEFAULT_SOURCE = `from IPython.display import display

for i in range(100):
    display('I am a long string which is repeatedly added to the dom in separated divs: %d' % i)`

const CellExample = () => {
  const cellStore = useJupyterStore().cellStore();
  const cellId = 'cell-1'

  console.log('Cell Outputs', (cellStore.getAdapter(cellId)?.cell as CodeCell).outputArea.model.toJSON());
  return (
    <Jupyter>
      <Box as="h1">A Jupyter Cell</Box>
      <Box>
        Outputs Count: {cellStore.getOutputsCount(cellId)}
      </Box>
      <Box>
        Source: {cellStore.getSource(cellId)}
      </Box>
      <Box>
        <Button onClick={() => cellStore.execute(cellId)}>Run cell</Button>
      </Box>
      <Cell source={DEFAULT_SOURCE} id={cellId}/>
    </Jupyter>
  )
}

root.render(<CellExample/>);
