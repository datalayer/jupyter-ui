/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Box } from '@datalayer/primer-addons';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { useJupyter } from '../jupyter/JupyterUse';
import { Cell } from '../components/cell/Cell';

const CODE = `import sys

print("👋 Hello Jupyter React Lite")
print(f"Platform: {sys.platform}")
print(f"IPython: {get_ipython()}")`;

const CellLiteExample = () => {
  const { defaultKernel } = useJupyter({
    startDefaultKernel: true,
    lite: true,
  });
  return (
    <JupyterReactTheme>
      <Box as="h1">Cell with a Lite Kernel</Box>
      {defaultKernel && (
        <Cell id="jupyter-cell-lite-1" source={CODE} kernel={defaultKernel} />
      )}
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<CellLiteExample />);
