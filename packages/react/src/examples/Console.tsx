import { createRoot } from 'react-dom/client';
import { Box } from '@primer/react';
import Jupyter from '../jupyter/Jupyter';
import Console from '../components/console/Console';

import "./../../style/index.css";

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <Jupyter lite={true}>
    <Box as="h1">A Jupyter Console</Box>
    <Console />
  </Jupyter>
);
