/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Box } from '@primer/react';
import { Jupyter } from '../jupyter/Jupyter';
import Console from '../components/console/Console';

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <Jupyter startDefaultKernel lite>
    <Box as="h1">A Jupyter Console with a Lite Kernel</Box>
    <Console
      code={`import micropip
await micropip.install('numpy')
import numpy
print(f'👋 Hello Jupyter Console with a Lite Kernel - Platform: {sys.platform} - IPython: {get_ipython()}") - numpy {numpy.__version__}')`}
    />
  </Jupyter>
);
