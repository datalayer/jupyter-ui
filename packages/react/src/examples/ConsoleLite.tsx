/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Box } from '@primer/react';
import Jupyter from '../jupyter/Jupyter';
import Console from '../components/console/Console';

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <Jupyter lite={true}>
    <Box as="h1">A Jupyter Console with a Lite Kernel</Box>
    <Console
      code={[
        'import piplite',
        "await piplite.install('numpy')",
        "print('👋 Hello Jupyter Console')",
      ]}
    />
  </Jupyter>
);
