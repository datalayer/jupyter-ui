/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { JupyterReactTheme } from '../theme';
import { Terminal } from '../components/terminal/Terminal';

const TerminalExample = () => (
  <JupyterReactTheme>
    <Terminal colormode="dark" height="800px" />
  </JupyterReactTheme>
);

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<TerminalExample />);
