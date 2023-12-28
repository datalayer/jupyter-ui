/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import JupyterReact from './JupyterReact';

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<JupyterReact />);
