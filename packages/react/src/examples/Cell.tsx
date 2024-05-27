/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Box, Button } from '@primer/react';
import { useJupyterReactStore } from './../state';
import Jupyter from '../jupyter/Jupyter';
import Cell from '../components/cell/Cell';

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

const DEFAULT_SOURCE = `from IPython.display import display

for i in range(100):
    display('I am a long string which is repeatedly added to the dom in separated divs: %d' % i)`

const CellExample = () => {
  const cellStore = useJupyterReactStore().cellStore();
  return (
    <Jupyter>
      <Box as="h1">A Jupyter Cell</Box>
      <Box>
          Outputs Count: {cellStore.outputsCount}
        </Box>
        <Box>
          Source: {cellStore.source}
        </Box>
        <Box>
          <Button onClick={() => cellStore.execute()}>Run cell</Button>
        </Box>
      <Cell source={DEFAULT_SOURCE}/>
    </Jupyter>
  )
}

root.render(<CellExample/>);
