import { createRoot } from 'react-dom/client';
import { Box } from '@primer/react';
import Jupyter from '../jupyter/Jupyter';
import Cell from '../components/cell/Cell';

import "./../../style/index.css";

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <Jupyter lite={false}>
    <Box as="h1">Jupyter Cells wrapped in a single Jupyter Context</Box>
    <Cell source="x=1"/>
    <Cell source="print(x)"/>
    <Cell source={`import random

r = random.randint(0,9)`}/>
    <Cell source="print(f'Random integer: {r}')"/>
  </Jupyter>
);
