/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */
import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '@primer/react';
import { PlayIcon } from '@primer/octicons-react';
import { Box } from '@datalayer/primer-addons';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { useJupyter } from '../jupyter/JupyterUse';
import { cellsStore, ICellsState } from '../components/cell/CellState';
import { Cell } from '../components/cell/Cell';

const CODE_CELL_1 = `import time
print("Cell 1 start...")
time.sleep(3)
print("Cell 1 end.")`;

const CODE_CELL_2 = `import time
print("Cell 2 start...")
time.sleep(3)
print("Cell 2 end.")`;

const CellsExecuteExample = () => {
  const { defaultKernel } = useJupyter({ startDefaultKernel: true });
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
  };
  return (
    <JupyterReactTheme>
      <Box as="h1">Cells Execute Example</Box>
      {defaultKernel && (
        <Box style={{ marginTop: '20px' }}>
          <Cell
            id="1"
            type="code"
            source={CODE_CELL_1}
            autoStart={false}
            showToolbar={false}
            kernel={defaultKernel}
          />
          <Cell
            id="2"
            type="code"
            source={CODE_CELL_2}
            autoStart={false}
            showToolbar={false}
            kernel={defaultKernel}
          />
          <Button
            onClick={onExecuteClick}
            disabled={executionDisable}
            leadingVisual={() => <PlayIcon />}
            style={{
              marginLeft: '50px',
              marginTop: '20px',
            }}
          >
            Execute all
          </Button>
        </Box>
      )}
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<CellsExecuteExample />);
