/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Box } from '@datalayer/primer-addons';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { useJupyter } from '../jupyter/JupyterContext';
import { Cell } from '../components/cell/Cell';

const CellsExample = () => {
  const { defaultKernel } = useJupyter({ startDefaultKernel: true });
  return (
    <JupyterReactTheme>
      <Box as="h1">Cells</Box>
      {defaultKernel && (
        <>
          <Cell source={'print("Hello from Cell 1")'} kernel={defaultKernel} />
          <Cell source={'print("Hello from Cell 2")'} kernel={defaultKernel} />
          <Cell source={'print("Hello from Cell 3")'} kernel={defaultKernel} />
        </>
      )}
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<CellsExample />);
