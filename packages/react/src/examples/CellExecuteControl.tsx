/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */
import React, {useEffect} from 'react';
import { createRoot } from 'react-dom/client';

import {Button, Box} from '@primer/react';

import Jupyter from '../jupyter/Jupyter';
import Cell from '../components/cell/Cell';
import { cellsStore, ICellsState } from '../components/cell/CellState';


const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

const btnStyle = {
    marginLeft: '50px',
    marginTop: '20px'
}

const CELL_CODE = `import time\ntime.sleep(3)`

const CellExecuteControl = () => {
  const [executionDisable, setExecutionDisable] = React.useState(false);

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
    <Jupyter>
      <Box style={{marginTop: '20px'}}>
        <Cell 
          id='1' 
          type='code'
          source={CELL_CODE} 
          autoStart={false} 
          showToolbar={false} />
        <Cell 
          id='2' 
          type='code'
          autoStart={false} 
          showToolbar={false} />
        <Button 
          onClick={onExecuteClick} 
          disabled={executionDisable} 
          style={btnStyle}>Execute all</Button>
      </Box>
    </Jupyter>
  )
};

root.render(<CellExecuteControl/>);
