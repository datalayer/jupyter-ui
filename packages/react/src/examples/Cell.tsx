import { createRoot } from 'react-dom/client';
import { Box } from '@primer/react';
import Jupyter from '../jupyter/Jupyter';
import Cell from '../components/cell/Cell';

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <Jupyter>
    <Box as="h1">A Jupyter Cell</Box>
    <Cell />
  </Jupyter>
);
