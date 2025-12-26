/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Jupyter } from '../jupyter/Jupyter';
import Terminal from '../components/terminal/Terminal';

const TerminalExample = () => (
  <Jupyter startDefaultKernel={false} terminals>
    <Terminal colormode="dark" height="800px" />
  </Jupyter>
);

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<TerminalExample />);
