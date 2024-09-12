/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */
import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Box } from '@primer/react';
import { cellsStore, ICellsState } from '../components/cell/CellState';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import Cell from '../components/cell/Cell';

const CODE_CELL_1 = `import time
time.sleep(3)
print("Cell 1 done.")`

const CODE_CELL_2 = `import time
time.sleep(3)
print("Cell 2 done.")`

const CellsExecute = () => {
  const [executionDisable, setExecutionDisable] = useState(false);
  useEffect(() => {
    const handleChange = (newState: ICellsState) => {
      setExecutionDisable(newState.isAnyCellExecuting);
    };
    const unsubscribe = cellsStore.subscribe(handleChange);
    return () => {
      unsubscribe();
    };
  }, []);
  const onExecuteClick = () => {
    cellsStore.getState().execute();
  }
  return (
    <JupyterReactTheme>
      <Box style={{marginTop: '20px'}}>
        <Cell
          id='1'
          type='code'
          source={CODE_CELL_1} 
          autoStart={false}
          showToolbar={false}
        />
        <Cell
          id='2'
          type='code'
          source={CODE_CELL_2}
          autoStart={false}
          showToolbar={false}
        />
        <Button
          onClick={onExecuteClick} 
          disabled={executionDisable} 
          style={{
            marginLeft: '50px',
            marginTop: '20px'
          }}
        >
          Execute all
        </Button>
      </Box>
    </JupyterReactTheme>
  )
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<CellsExecute/>);
