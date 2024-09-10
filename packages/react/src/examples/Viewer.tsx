/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Box, Text } from '@primer/react';
import Jupyter from '../jupyter/Jupyter';
import Viewer from '../components/viewer/Viewer';

import matplotlib from './notebooks/Matplotlib.ipynb.json';

const JupyterViewerExample = () => {
  return (
    <>
      <Box m={3}>
        <Jupyter serverless>
          <Text as="h1">Jupyter Viewer with Plotly outputs</Text>
          <Viewer
            nbformatUrl="https://raw.githubusercontent.com/datalayer-examples/notebooks/main/daily-stock.ipynb"
            outputs
          />
          <Text as="h1">Jupyter Viewer without outputs</Text>
          <Viewer
            nbformat={matplotlib}
            outputs={false}
          />
        </Jupyter>
      </Box>
    </>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<JuptyerViewerExample />);
