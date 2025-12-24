/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Box } from '@datalayer/primer-addons';
import { useJupyter } from '../jupyter';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { Cell } from '../components/cell/Cell';

const CellLite = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    lite: true,
    startDefaultKernel: true,
  });
  const [kernelReady, setKernelReady] = useState(false);

  useEffect(() => {
    if (defaultKernel) {
      defaultKernel.ready.then(() => {
        setKernelReady(true);
      });
    }
  }, [defaultKernel]);

  return serviceManager && defaultKernel && kernelReady ? (
    <JupyterReactTheme>
      <Box as="h1">A Jupyter Cell with a Lite Kernel</Box>
      <Cell
        source={`import sys
print(f"👋 Hello Jupyter UI Lite - Platform: {sys.platform} - IPython: {get_ipython()}")`}
        kernel={defaultKernel}
      />
    </JupyterReactTheme>
  ) : (
    <Box>Loading Jupyter Lite...</Box>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<CellLite />);
