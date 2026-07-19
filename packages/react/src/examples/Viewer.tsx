/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Text } from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import { ExampleJupyterReactTheme } from './ExampleJupyterReactTheme';
import { Viewer } from '../components/viewer/Viewer';

import matplotlib from './notebooks/Matplotlib.ipynb.json';

const ViewerExample = () => {
  return (
    <>
      <Box m={3}>
        <ExampleJupyterReactTheme>
          <Text as="h1">Viewer with Plotly outputs</Text>
          <Viewer
            nbformatUrl="https://raw.githubusercontent.com/datalayer-examples/notebooks/main/daily-stock.ipynb"
            outputs
          />
          <Text as="h1">Viewer without outputs</Text>
          <Viewer nbformat={matplotlib} outputs={false} />
        </ExampleJupyterReactTheme>
      </Box>
    </>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<ViewerExample />);
