/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Box } from '@datalayer/primer-addons';
import { useJupyter } from '../jupyter';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { Cell } from '../components/cell/Cell';

const CellLiteExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    lite: true,
    startDefaultKernel: true,
  });
  return serviceManager && defaultKernel ? (
    <JupyterReactTheme>
      <Box as="h1">Cell with a Lite Kernel</Box>
      <Cell
        source={`import sys
print(f"👋 Hello Jupyter UI Lite - Platform: {sys.platform} - IPython: {get_ipython()}")`}
        kernel={defaultKernel}
      />
    </JupyterReactTheme>
  ) : (
    <Box>Loading Cell Lite...</Box>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<CellLiteExample />);
